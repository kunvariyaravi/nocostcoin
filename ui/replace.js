const fs = require('fs');
const path = require('path');

const targetDirs = [
    'src/app/mainnet',
    'src/components/Sidebar',
    'src/components/Navbar',
    'src/components/NodeStatus',
    'src/components/Faucet',
    'src/components/AuthModal'
];

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content
                .replace(/\/testnet/g, '/mainnet')
                .replace(/Testnet/g, 'Mainnet')
                .replace(/testnet/g, 'mainnet');
                
            if (content !== newContent) {
                fs.writeFileSync(fullPath, newContent);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

targetDirs.forEach(processDir);
