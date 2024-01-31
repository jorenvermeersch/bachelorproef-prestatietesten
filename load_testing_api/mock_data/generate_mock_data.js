const fs = require("node:fs");

const generateUsers = (amount) => {
  const filepath = "./vusers.csv";
  const password = "8W£j84<<amM^";

  let users = "name,email,password\n";

  for (let index = 1; index <= amount; index++) {
    users += `vuser${index},vuser${index}@student.hogent.be,${password}${index}\n`;
  }

  fs.writeFile(filepath, users, (err) => {
    if (err) console.error(err);
  });
};

const generateTransactions = (amount) => {
  const filepath = "./transactions.csv";

  let transactions = "amount,date,placeId\n";

  for (let index = 1; index <= amount; index++) {
    transactions += `${1 + Math.floor(Math.random() * 2500)},`; // [1, 2500]
    transactions += `${new Date().toISOString()},`;
    transactions += `${1 + Math.floor(Math.random() * 2)}\n`; // [1, 3]
  }

  fs.writeFile(filepath, transactions, (err) => {
    if (err) console.error(err);
  });
};

generateUsers(100);
generateTransactions(20);
