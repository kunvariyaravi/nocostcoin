use warp::Filter;
use tokio::sync::{mpsc, oneshot};
use serde::{Deserialize, Serialize};
use crate::block::Block;
use crate::transaction::Transaction;

/// Commands sent from the API server to the main node loop
#[derive(Debug)]
pub enum ApiCommand {
    GetStats(oneshot::Sender<NodeStats>),
    GetLatestBlock(oneshot::Sender<Option<Block>>),
    GetBlock(String, oneshot::Sender<Option<Block>>),
    SubmitTransaction(Transaction, oneshot::Sender<Result<String, String>>),
    CreateTransaction(CreateTransactionRequest, oneshot::Sender<Result<String, String>>),
    GetMempool(oneshot::Sender<Vec<Transaction>>),
    GetPeers(oneshot::Sender<Vec<PeerInfo>>),
    CreateWallet(oneshot::Sender<CreateWalletResponse>),
    RecoverWallet(RecoverWalletRequest, oneshot::Sender<Result<String, String>>),
    GetBlocks(u64, usize, oneshot::Sender<Vec<Block>>),
    GetAccount(String, oneshot::Sender<Option<AccountResponse>>),
    GetTransaction(String, oneshot::Sender<Option<TransactionResponse>>),
    GetAddressHistory(String, usize, oneshot::Sender<Vec<TransactionResponse>>),
    GetValidators(oneshot::Sender<Vec<ValidatorStatusResponse>>),
    GetValidatorStatus(oneshot::Sender<Option<ValidatorStatusResponse>>),
    RegisterValidator(u64, oneshot::Sender<Result<String, String>>),
    GetConsensusState(oneshot::Sender<ConsensusStateResponse>),
    Faucet(FaucetRequest, oneshot::Sender<Result<FaucetResponse, String>>),
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TransactionResponse {
    pub hash: String, // Calculated hash
    pub transaction: Transaction,
    pub block_hash: String,
    pub status: String, // "confirmed" or "pending"
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccountResponse {
    pub address: String,
    pub balance: u64,
    pub nonce: u64,
}

#[derive(Debug, Deserialize)]
pub struct GetBlocksQuery {
    pub start_height: Option<u64>,
    pub limit: Option<usize>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ValidatorStatusResponse {
    pub pubkey: String,
    pub stake: u64,
    pub is_active: bool,
    pub last_voted_slot: u64, // Placeholder, implementation might vary
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConsensusStateResponse {
    pub finalized_block_hash: String,
    pub finalized_height: u64,
    pub current_epoch: u64,
    pub current_slot: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateWalletResponse {
    pub mnemonic: String,
    pub address: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecoverWalletRequest {
    pub mnemonic: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FaucetRequest {
    pub address: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RegisterValidatorRequest {
    pub stake: u64,
}

#[derive(Debug, Serialize, Clone)]
pub struct FaucetResponse {
    pub tx_hash: String,
    pub amount: u64,
    pub next_claim_time: i64,
}

#[derive(Debug, Serialize, Clone)]
pub struct PeerInfo {
    pub id: String,
    pub height: u64,
    pub address: Option<String>,
    pub protocol: Option<String>,
    pub latency: Option<u64>, // Placeholder for now
}

/// DTO for creating a transaction
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateTransactionRequest {
    pub receiver: String,
    pub amount: u64,
}

/// DTO for Node Statistics
#[derive(Debug, Serialize, Clone)]
pub struct NodeStats {
    pub height: u64,
    pub head_hash: String,
    pub peer_count: usize, // Placeholder, implementing real peer count might require more wiring
    pub balance: u64,
    pub address: String,
}

/// Configuration for the API server
#[derive(Clone)]
pub struct ApiConfig {
    pub port: u16,
}

pub fn start_api_server(
    config: ApiConfig,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>,
) -> impl std::future::Future<Output = ()> + Send {
    let cmd_tx_filter = warp::any().map(move || cmd_tx.clone());

    // GET /stats
    let stats_route = warp::path!("stats")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_stats);

    // GET /blocks?start_height=...&limit=...
    let blocks_route = warp::path!("blocks")
        .and(warp::get())
        .and(warp::query::<GetBlocksQuery>())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_blocks);

    // GET /block/latest
    let block_route = warp::path!("block" / "latest")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_latest_block);

    // GET /block/:hash
    let get_block_route = warp::path!("block" / String)
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_block);

    // GET /account/:address
    let account_route = warp::path!("account" / String)
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_account);

    // GET /account/:address/history
    let account_history_route = warp::path!("account" / String / "history")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_account_history);

    // GET /transaction/:hash
    let get_tx_route = warp::path!("transaction" / String)
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_transaction);

    // POST /transaction/send
    // Expects JSON body: Transaction
    let tx_route = warp::path!("transaction" / "send")
        .and(warp::post())
        .and(warp::body::json())
        .and(cmd_tx_filter.clone())
        .and_then(handle_submit_transaction);

    // POST /transaction/create
    // Expects JSON body: CreateTransactionRequest
    let create_tx_route = warp::path!("transaction" / "create")
        .and(warp::post())
        .and(warp::body::json())
        .and(cmd_tx_filter.clone())
        .and_then(handle_create_transaction);

    // GET /mempool
    let mempool_route = warp::path!("mempool")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_mempool);

    // GET /peers
    let peers_route = warp::path!("peers")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_peers);

    // POST /wallet/new
    let create_wallet_route = warp::path!("wallet" / "new")
        .and(warp::post())
        .and(cmd_tx_filter.clone())
        .and_then(handle_create_wallet);

    // POST /wallet/recover
    let recover_wallet_route = warp::path!("wallet" / "recover")
        .and(warp::post())
        .and(warp::body::json())
        .and(cmd_tx_filter.clone())
        .and_then(handle_recover_wallet);

    // GET /validator
    let validator_route = warp::path!("validator")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_validator_status);

    // GET /validators (List all)
    let validators_list_route = warp::path!("validators")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_validators);

    // GET /consensus
    let consensus_route = warp::path!("consensus")
        .and(warp::get())
        .and(cmd_tx_filter.clone())
        .and_then(handle_get_consensus_state);

    // POST /validator/register
    let register_validator_route = warp::path!("validator" / "register")
        .and(warp::post())
        .and(warp::body::json())
        .and(cmd_tx_filter.clone())
        .and_then(handle_register_validator);

    // POST /faucet
    let faucet_route = warp::path!("faucet")
        .and(warp::post())
        .and(warp::body::json())
        .and(cmd_tx_filter.clone())
        .and_then(handle_faucet);

    let routes = stats_route
        .or(blocks_route)
        .or(block_route)
        .or(get_block_route)
        .or(account_route)
        .or(account_history_route)
        .or(get_tx_route)
        .or(tx_route)
        .or(create_tx_route)
        .or(mempool_route)
        .or(peers_route)
        .or(create_wallet_route)
        .or(recover_wallet_route)
        .or(validator_route)
        .or(validators_list_route)
        .or(register_validator_route)
        .or(consensus_route)
        .or(faucet_route);

    println!("API server starting on http://0.0.0.0:{}", config.port);
    warp::serve(routes).run(([0, 0, 0, 0], config.port))
}

async fn handle_get_account_history(
    address: String,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    // Default limit 20
    if cmd_tx.send(ApiCommand::GetAddressHistory(address, 20, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(txs) => Ok(warp::reply::with_status(
            warp::reply::json(&txs),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_stats(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetStats(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(stats) => Ok(warp::reply::with_status(
            warp::reply::json(&stats),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_blocks(
    query: GetBlocksQuery,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    let start_height = query.start_height.unwrap_or(u64::MAX); // Special value to mean "from head"
    let limit = query.limit.unwrap_or(10);

    if cmd_tx.send(ApiCommand::GetBlocks(start_height, limit, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(blocks) => Ok(warp::reply::with_status(
            warp::reply::json(&blocks),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_latest_block(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetLatestBlock(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"), 
            warp::http::StatusCode::INTERNAL_SERVER_ERROR
        ));
    }

    match rx.await {
        Ok(Some(block)) => Ok(warp::reply::with_status(
            warp::reply::json(&block),
            warp::http::StatusCode::OK,
        )),
        Ok(None) => Ok(warp::reply::with_status(
            warp::reply::json(&"No blocks yet"),
            warp::http::StatusCode::NOT_FOUND,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_block(
    hash: String,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetBlock(hash, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"), 
            warp::http::StatusCode::INTERNAL_SERVER_ERROR
        ));
    }

    match rx.await {
        Ok(Some(block)) => Ok(warp::reply::with_status(
            warp::reply::json(&block),
            warp::http::StatusCode::OK,
        )),
        Ok(None) => Ok(warp::reply::with_status(
            warp::reply::json(&"Block not found"),
            warp::http::StatusCode::NOT_FOUND,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_account(
    address: String,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetAccount(address, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Some(account)) => Ok(warp::reply::with_status(
            warp::reply::json(&account),
            warp::http::StatusCode::OK,
        )),
        Ok(None) => Ok(warp::reply::with_status(
            warp::reply::json(&"Account not found"),
            warp::http::StatusCode::NOT_FOUND,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_transaction(
    hash: String,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetTransaction(hash, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Some(response)) => Ok(warp::reply::with_status(
            warp::reply::json(&response),
            warp::http::StatusCode::OK,
        )),
        Ok(None) => Ok(warp::reply::with_status(
            warp::reply::json(&"Transaction not found"),
            warp::http::StatusCode::NOT_FOUND,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_submit_transaction(
    transaction: Transaction,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();

    if cmd_tx.send(ApiCommand::SubmitTransaction(transaction, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Ok(hash)) => Ok(warp::reply::with_status(
            warp::reply::json(&hash),
            warp::http::StatusCode::OK,
        )),
        Ok(Err(e)) => Ok(warp::reply::with_status(
            warp::reply::json(&e),
            warp::http::StatusCode::BAD_REQUEST,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_create_transaction(
    request: CreateTransactionRequest,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();

    if cmd_tx.send(ApiCommand::CreateTransaction(request, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Ok(hash)) => Ok(warp::reply::with_status(
            warp::reply::json(&hash),
            warp::http::StatusCode::OK,
        )),
        Ok(Err(e)) => Ok(warp::reply::with_status(
            warp::reply::json(&e),
            warp::http::StatusCode::BAD_REQUEST,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_mempool(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetMempool(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(txs) => Ok(warp::reply::with_status(
            warp::reply::json(&txs),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_peers(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetPeers(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(peers) => Ok(warp::reply::with_status(
            warp::reply::json(&peers),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_create_wallet(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::CreateWallet(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(response) => Ok(warp::reply::with_status(
            warp::reply::json(&response),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_recover_wallet(
    request: RecoverWalletRequest,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::RecoverWallet(request, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Ok(address)) => Ok(warp::reply::with_status(
            warp::reply::json(&address),
            warp::http::StatusCode::OK,
        )),
        Ok(Err(e)) => Ok(warp::reply::with_status(
            warp::reply::json(&e),
            warp::http::StatusCode::BAD_REQUEST,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_validator_status(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetValidatorStatus(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Some(status)) => Ok(warp::reply::with_status(
            warp::reply::json(&status),
            warp::http::StatusCode::OK,
        )),
        Ok(None) => Ok(warp::reply::with_status(
            warp::reply::json(&"Validator not active"),
            warp::http::StatusCode::NOT_FOUND,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_validators(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetValidators(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(validators) => Ok(warp::reply::with_status(
            warp::reply::json(&validators),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_register_validator(
    request: RegisterValidatorRequest,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::RegisterValidator(request.stake, tx)).is_err() {
         return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
         Ok(Ok(tx_hash)) => Ok(warp::reply::with_status(
            warp::reply::json(&tx_hash),
            warp::http::StatusCode::OK,
        )),
        Ok(Err(e)) => Ok(warp::reply::with_status(
            warp::reply::json(&e),
            warp::http::StatusCode::BAD_REQUEST,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_get_consensus_state(
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::GetConsensusState(tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(state) => Ok(warp::reply::with_status(
            warp::reply::json(&state),
            warp::http::StatusCode::OK,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}

async fn handle_faucet(
    request: FaucetRequest,
    cmd_tx: mpsc::UnboundedSender<ApiCommand>
) -> Result<impl warp::Reply, warp::Rejection> {
    let (tx, rx) = oneshot::channel();
    
    if cmd_tx.send(ApiCommand::Faucet(request, tx)).is_err() {
        return Ok(warp::reply::with_status(
            warp::reply::json(&"Internal Server Error"),
            warp::http::StatusCode::INTERNAL_SERVER_ERROR,
        ));
    }

    match rx.await {
        Ok(Ok(response)) => Ok(warp::reply::with_status(
            warp::reply::json(&response),
            warp::http::StatusCode::OK,
        )),
        Ok(Err(e)) => Ok(warp::reply::with_status(
            warp::reply::json(&e),
            warp::http::StatusCode::BAD_REQUEST,
        )),
        Err(_) => Ok(warp::reply::with_status(
            warp::reply::json(&"Request timed out"),
            warp::http::StatusCode::REQUEST_TIMEOUT,
        )),
    }
}
