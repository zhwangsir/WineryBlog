function createWallet() {
  let balance = 0;               // 余额：外面拿不到，只能通过下面的方法读写
  return {
    deposit(amount) {
      balance += amount;
    },
    spend(amount) {
      if (amount > balance) return false;   // 规则写在这里，外面绕不过去
      balance -= amount;
      return true;
    },
    getBalance() {
      return balance;
    },
  };
}

const wallet = createWallet();
wallet.deposit(100);
console.log(wallet.getBalance());  // 100
wallet.balance = 999999;           // 只是在 wallet 这个对象上多了一个叫 balance 的属性
console.log(wallet.getBalance());  // 100（闭包里的 balance 没变）
