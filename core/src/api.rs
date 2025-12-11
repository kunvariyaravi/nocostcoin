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

    let routes = stats_route
        .or(block_route)
        .or(get_block_route)
        .or(tx_route)
        .or(create_tx_route);

    println!("API server starting on http://0.0.0.0:{}", config.port);
    warp::serve(routes).run(([0, 0, 0, 0], config.port))
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
