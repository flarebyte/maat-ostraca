import fs from 'node:fs';
import axios from 'axios';

export function chargeCustomer() {
  fs.readFileSync('in.txt', 'utf8');
  fetch('https://example.com/items');
  axios.post('/charge', {});
}

const loadLedger = () => {
  fs.promises.readFile('ledger.txt', 'utf8');
  axios.get('/ledger');
};

const saveLedger = () => {
  fs.writeFileSync('ledger.txt', 'x');
  process.stdout.write('ok');
};

class PaymentService {
  Charge() {
    fs.readFileSync('a.txt', 'utf8');
    fs.writeFileSync('b.txt', 'value');
    axios.patch('/payment', {});
  }
}

void loadLedger;
void saveLedger;
void PaymentService;
