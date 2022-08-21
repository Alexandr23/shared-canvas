console.log("ServiceWorker: hi!");

self.addEventListener("push", (event) => {
  console.log("push", event, event.data, event.data.text());

  const promiseChain = self.registration.showNotification("Shared Canvas", {
    body: event.data.text(),
  });

  event.waitUntil(promiseChain);
});
