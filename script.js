const url = "https://my-api.plantnet.org/v2/_status";

fetch(url, {
  method: "GET",
  headers: {
    accept: "application/json",
  },
})
  .then((response) => response.json())
  .then((data) => console.log("API Status:", data))
  .catch((error) => console.error("Error:", error));
