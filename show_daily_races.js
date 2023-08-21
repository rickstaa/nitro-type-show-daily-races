// ==UserScript==
// @name         Nitro Type - Show Daily Races
// @namespace    https://github.com/rickstaa/nitro-type-show-daily-races
// @version      1.0.0
// @description  Displays the number of daily races completed by each team member in the team roster table on the Nitro Type team page.
// @author       Rick Staa
// @match        *://*.nitrotype.com/team/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// ==/UserScript==

const TEAM_ID = window.location.href.split("/")[4];
let TEAM_STATS = null;

/**
 * Fetches team stats from NitroType API.
 * @param {number} teamId - The ID of the team to fetch stats for.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the team stats.
 */
const fetchTeamStats = async (teamId) => {
  const response = await fetch(
    `https://www.nitrotype.com/api/v2/teams/${teamId}`
  );
  const data = await response.json();
  return data;
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

(function () {
  "use strict";

  /**
   * Add the daily races column to the team stats table when the page has loaded.
   */
  window.addEventListener("load", async () => {
    const teamStatsTable = await waitForElm(
      ".table.table--striped.table--selectable.table--team.table--teamOverview"
    );
    const teamStatsTableHeaderRow = await waitForElm(
      ".table.table--striped.table--selectable.table--team.table--teamOverview thead tr"
    );
    const teamStatsTableBody = await waitForElm(
      ".table.table--striped.table--selectable.table--team.table--teamOverview tbody"
    );
    const teamStatsTableRows = Array.from(
      teamStatsTable.querySelectorAll("tbody tr")
    );

    // Add extra daily races header column.
    const dailyRacesHeader = document.createElement("th");
    dailyRacesHeader.classList.add(
      "table-cell",
      "table-cell--lastRace",
      "table-filter"
    );
    dailyRacesHeader.innerHTML = "Daily<br>Races";
    teamStatsTableHeaderRow.appendChild(dailyRacesHeader);

    // Find Team Races and Members Since columns.
    let teamRacesColumn = Array.from(teamStatsTableHeaderRow.cells).find(
      (cell) => cell.innerHTML.includes("Team<br>Races")
    ).cellIndex;
    let memberSinceColumn = Array.from(teamStatsTableHeaderRow.cells).find(
      (cell) => cell.innerHTML.includes("Member<br>Since")
    ).cellIndex;

    // Loop through all team members and display the daily races.
    for (let i = 0; i < teamStatsTableRows.length; i++) {
      const row = teamStatsTableRows[i];

      // Retrieve member days.
      const memberSince = row.cells[memberSinceColumn].textContent.trim();
      const timeComponents = memberSince.split(" ");
      let memberDays = 0;
      if (timeComponents[1] === "days") {
        memberDays = parseInt(timeComponents[0], 10);
      } else if (timeComponents[1] === "day") {
        memberDays = 1;
      } else {
        if (!TEAM_STATS) {
          TEAM_STATS = await fetchTeamStats(TEAM_ID);
        }

        // Retrieve number of days since the user joined the team.
        const joinStamp = TEAM_STATS.results.members[i].joinStamp;
        const jointDate = new Date(joinStamp * 1000);
        const today = new Date();
        const timeDiff = Math.abs(today.getTime() - jointDate.getTime());
        memberDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      }

      // Calculate daily races.
      const races = parseInt(
        row.cells[teamRacesColumn].textContent.trim().replace(",", ""),
        10
      );
      const dailyRaces = races / memberDays;

      // Add daily races column.
      const dailyRacesCell = document.createElement("td");
      dailyRacesCell.classList.add("table-cell", "table-cell--lastRace");
      dailyRacesCell.textContent = dailyRaces.toFixed(0);
      row.appendChild(dailyRacesCell);
    }

    // Add a click handler that sorts the team members by daily races.
    dailyRacesHeader.addEventListener("click", function () {
      // Sort rows by dailyRaces in descending order.
      teamStatsTableRows.sort(function (a, b) {
        const aDailyRaces = parseInt(
          a.cells[teamStatsTableHeaderRow.cells.length - 1].textContent.trim(),
          10
        );
        const bDailyRaces = parseInt(
          b.cells[teamStatsTableHeaderRow.cells.length - 1].textContent.trim(),
          10
        );
        return bDailyRaces - aDailyRaces;
      });

      // If already sorted descending change to ascending.
      if (dailyRacesHeader.classList.contains("table-filter--desc")) {
        teamStatsTableRows.reverse();
        dailyRacesHeader.classList.remove("table-filter--desc");
        dailyRacesHeader.classList.add("table-filter--asc");
      } else {
        dailyRacesHeader.classList.add("table-filter--desc");
      }

      // Remove the sort icon from all other columns.
      Array.from(teamStatsTableHeaderRow.cells).forEach((cell) => {
        if (cell !== dailyRacesHeader) {
          cell.classList.remove("table-filter--asc", "table-filter--desc");
        }
      });

      // Remove rows and add them back in sorted order.
      teamStatsTableRows.forEach((row) => {
        teamStatsTableBody.removeChild(row);
        teamStatsTableBody.appendChild(row);
      });

      // Remove the sort icon from daily races column when another column is clicked.
      Array.from(teamStatsTableHeaderRow.cells).forEach((cell) => {
        if (cell !== dailyRacesHeader) {
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
