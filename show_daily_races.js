// ==UserScript==
// @name         Nitro Type - Show Daily Races
// @namespace    https://greasyfork.org/en/users/863158-rickstaa
// @version      0.3.0
// @description  Displays the number of daily races completed by each team member in the team roster table on the Nitro Type team page.
// @author       Rick Staa
// @match        *://*.nitrotype.com/team/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// ==/UserScript==

(function () {
  "use strict";

  /**
   * Returns the number of days based on the given time string.
   * @param {string} timeString - The time string to parse.
   * @returns {number} The number of days.
   */
  const getTimeInDays = (timeString) => {
    let timeComponents = timeString.split(" ");

    // Retrieve the number of days on the team.
    const counter = timeComponents[0] != "a" ? timeComponents[0] : 1;
    const timeKey = timeComponents[1] ? timeComponents[1] : "day";
    let days;
    switch (timeKey) {
      case "year":
        days = 365;
        break;
      case "years":
        days = 365 * counter;
        break;
      case "month":
        days = 30;
        break;
      case "months":
        days = 30 * counter;
        break;
      case "week":
        days = 7;
        break;
      case "weeks":
        days = 7 * counter;
        break;
      case "days":
        days = 1 * counter;
        break;
      default:
        days = 1;
        break;
    }
    return days;
  };

  /**
   * Wait for the element to be available in the DOM.
   * @param {*} selector The selector to wait for.
   * @returns The element.
   */
  function waitForElm(selector) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((_) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  }

  /**
   * Add the daily races column to the team stats table when the page has loaded.
   */
  window.addEventListener("load", async () => {
    const teamStatsTable = await waitForElm(
      ".table.table--striped.table--selectable.table--team.table--teamOverview"
    );
    const teamStatsTableHeader = await waitForElm("thead tr");

    // Add extra daily races header column.
    const dailyRacesHeader = document.createElement("th");
    dailyRacesHeader.classList.add(
      "table-cell",
      "table-cell--lastRace",
      "table-filter"
    );
    dailyRacesHeader.innerHTML = "Daily<br>Races";
    teamStatsTableHeader.appendChild(dailyRacesHeader);

    // Find Team Races and Members Since columns.
    const teamRacesColumn = teamStatsTableHeader.querySelector(
      'th:contains("Team\\nRaces")'
    ).cellIndex;
    const memberSinceColumn = teamStatsTableHeader.querySelector(
      'th:contains("Member\\nSince")'
    ).cellIndex;

    // Loop through all team members and display the daily races.
    Array.from(teamStatsTable.querySelectorAll("tbody tr")).map((row) => {
      // Calculate daily races.
      const memberDays = getTimeInDays(
        row.cells[memberSinceColumn].textContent.trim()
      );
      const races = parseInt(
        row.cells[teamRacesColumn].textContent.replace(",", "")
      );
      const dailyRaces = races / memberDays;

      // Add daily races column.
      const dailyRacesCell = document.createElement("td");
      dailyRacesCell.classList.add("table-cell", "table-cell--lastRace");
      dailyRacesCell.textContent = dailyRaces.toFixed(0);
      row.appendChild(dailyRacesCell);
    });

    // Add a click handler that sorts the team members by daily races.
    dailyRacesHeader.addEventListener("click", function () {
      const rows = Array.from(teamStatsTable.querySelectorAll("tbody tr"));

      // Sort rows by dailyRaces in descending order.
      rows.sort(function (a, b) {
        const aDailyRaces = parseInt(
          a.cells[teamStatsTableHeader.cells.length - 1].textContent
        );
        const bDailyRaces = parseInt(
          b.cells[teamStatsTableHeader.cells.length - 1].textContent
        );
        return bDailyRaces - aDailyRaces;
      });

      // If already sorted descending change to ascending.
      if (dailyRacesHeader.classList.contains("table-filter--desc")) {
        rows.reverse();
        dailyRacesHeader.classList.remove("table-filter--desc");
        dailyRacesHeader.classList.add("table-filter--asc");
      } else {
        dailyRacesHeader.classList.add("table-filter--desc");
      }

      // Remove the sort icon from all other columns.
      Array.from(teamStatsTableHeader.cells).forEach((cell) => {
        if (cell != dailyRacesHeader) {
          cell.classList.remove("table-filter--asc", "table-filter--desc");
        }
      });

      // Remove rows and add them back in sorted order.
      rows.forEach((row) => {
        teamStatsTable.querySelector("tbody").removeChild(row);
        teamStatsTable.querySelector("tbody").appendChild(row);
      });

      // Remove the sort icon from daily races column when another column is clicked.
      Array.from(teamStatsTableHeader.cells).forEach((cell) => {
        if (cell != dailyRacesHeader) {
          cell.addEventListener("click", function () {
            dailyRacesHeader.classList.remove(
              "table-filter--asc",
              "table-filter--desc"
            );
          });
        }
      });
    });
  });
})();
