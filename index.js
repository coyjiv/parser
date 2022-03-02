const puppeteer = require("puppeteer");
const ObjectsToCsv = require("objects-to-csv");

(async () => {
  try {
    const browser = await puppeteer.launch();
    let done = false;
    let index = 7;
    let jsonData = [];
    while (done === false) {
      const page = await browser.newPage();
      const response = await page.goto(
        `https://clutch.co/developers/ukraine?agency_size=Freelancer&agency_size=10+-+49&agency_size=2+-+9&page=${index}`
      );

      if (response._request._response._status === 200) {
        console.log("parsing page number ", index);
        await page.waitForSelector(".company_info", { timeout: 10000 });
        const linksProfileCompany = await page.evaluate(() => {
          const a = document.querySelectorAll(".company_info");
          return [...a].map((el) => el.children[0].href);
        });
        console.log(linksProfileCompany);
        linksProfileCompany.map(async (el) => {
          const companyPage = await browser.newPage();
          const response = await companyPage.goto(el);
          if (response._request._response._status === 200) {
            await companyPage.waitForSelector(".module-list", {
              timeout: 30000,
            });
            const info = await companyPage.evaluate(() => {
              const a = document.querySelector(".module-list");
              const information = [...a.children].map(
                (el) => el.children[1].innerText
              );
              const location = document
                .querySelector(".location-name")
                .textContent.replace(/[^a-zA-Z ]/g, "");
              information.push(location);
              return information;
            });
            info.push(el);
            jsonData.push(Object.assign({}, info));
            new ObjectsToCsv(jsonData).toDisk("data.csv", { append: true });
          }
        });

        index++;
      } else {
        console.log(response._request._response._status);
        done = true;
        console.log("PARSING DONE current index ", index);

        await browser.close();
      }
    }
  } catch (error) {
    console.log(error);
  }
})();
