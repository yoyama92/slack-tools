const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");

chrome.storage.local.get(null, (options) => {
  button1.value = options.button1;
  button2.value = options.button2;
  document.querySelector("#msg").innerText = JSON.stringify(options, null, 2);
});

document.getElementById("submit").addEventListener("click", (e) => {
  const options = {
    button1: button1.value,
    button2: button2.value
  }
  chrome.storage.local.set(options);
  document.querySelector("#msg").innerText = JSON.stringify(options, null, 2);
});
