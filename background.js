let currentPage = 1;
let maxPages = 3;
let startDate = "";
let endDate = "";
const pageLoadDelay = 1000;

function navigateToPage(page, startDate, endDate) {
  const url = `https://www.thedailystar.net/es-search/?page=${page}&ategory=Bangladesh&startDate=${startDate}&endDate=${endDate}`;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      console.error("No active tab found.");
      return;
    }

    const tabId = tabs[0].id;

    chrome.scripting.executeScript({
      target: { tabId },
      func: (url) => {
        window.location.href = url;
      },
      args: [url],
    });

    setTimeout(() => {
      injectScript(tabId, page);
    }, pageLoadDelay);
  });
}

function injectScript(tabId, page) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: (page) => {
        console.log("Injecting script...");

        const container = document.querySelector(
          ".large-8.medium-12.cell.right-section"
        );
        if (!container) {
          console.error("Container not found.");
          return;
        }

        const news = [];

        for (const card of container.querySelectorAll(
          ".grid-x.grid-margin-x.right-card"
        )) {
          const titleElement = card.querySelector(".large-6.cell a h5.title");
          const authorElement = card.querySelector(
            ".large-6.cell p span.author"
          );
          const linkElement = card.querySelector(".large-6.cell a");

          if (titleElement && authorElement && linkElement) {
            const headline = {
              title: titleElement.textContent.trim(),
              author: authorElement.textContent.trim(),
              link: linkElement.href,
            };

            fetch(headline.link)
              .then((response) => response.text())
              .then((content) => {
                const tempElement = document.createElement("div");
                tempElement.innerHTML = content;

                const mainContent =
                  tempElement
                    .querySelector(".pb-20.clearfix")
                    ?.textContent.trim() || "";

                headline.mainNews = mainContent;

                news.push(headline);

                if (
                  news.length ===
                  container.querySelectorAll(".grid-x.grid-margin-x.right-card")
                    .length
                ) {
                  localStorage.setItem(
                    `newsDataPage${page}`,
                    JSON.stringify(news)
                  );

                  console.log(`Page ${page} data saved to localStorage.`);
                }
              })
              .catch((error) => {
                console.error("Error fetching article content:", error);
              });
          }
        }
      },
      args: [page],
    })
    .then(() => {
      setTimeout(() => {
        if (currentPage < maxPages) {
          currentPage++;
          navigateToPage(currentPage, startDate, endDate);
        } else {
          chrome.scripting.executeScript({
            target: { tabId },
            func: () => {
              const allData = [];

              for (let i = 1; i <= localStorage.length; i++) {
                const pageData = JSON.parse(
                  localStorage.getItem(`newsDataPage${i}`) || "[]"
                );
                allData.push(...pageData);
              }

              if (allData.length > 0) {
                const json = JSON.stringify(allData, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const jsonUrl = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = jsonUrl;
                a.download = "news_data_full.json";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);

                console.log("Full JSON file downloaded.");

                localStorage.clear();
              } else {
                console.log("No data to download.");
              }
            },
          });
        }
      }, 1000);
    })
    .catch((error) => {
      console.error("Error injecting script:", error);
    });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "startScraping") {
    currentPage = 1;
    maxPages = message.pageNumber;
    startDate = message.startDate;
    endDate = message.endDate;

    chrome.tabs.create(
      {
        url: `https://www.thedailystar.net/es-search/?page=${currentPage}&ategory=Bangladesh&startDate=${startDate}&endDate=${endDate}`,
      },
      (tab) => {
        navigateToPage(currentPage, startDate, endDate);
      }
    );
  }
});
