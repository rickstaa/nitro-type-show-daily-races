// ==UserScript==
// @name         Nitro Type - Show Daily Races
// @namespace    https://github.com/rickstaa/nitro-type-show-daily-races
// @version      1.3.0
// @description  Displays the number of daily races completed by each team member in the team roster table on the Nitro Type team page.
// @author       Rick Staa
// @match        *://*.nitrotype.com/team/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// ==/UserScript==

/**
 * Fetches team stats from NitroType API.
 * @param {number} teamId - The ID of the team to fetch stats for.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the team stats.
 */
const fetchTeamStats = async (teamId) => {
  try {
    const response = await fetch(
      `https://www.nitrotype.com/api/v2/teams/${teamId}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error fetching team stats: ${error}`);
    throw error;
  }
};

/**
 * Wait for an element to be available in the DOM.
 * @param {string} selector - The selector to wait for.
 * @returns {Promise<Element>} - A promise that resolves to the element.
 */
const waitForElm = (selector) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          const element = document.querySelector(selector);
          if (element) {
            observer.disconnect();
            resolve(element);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    const element = document.querySelector(selector);
    if (element) {
      observer.disconnect();
      resolve(element);
    }
  });
};

/**
 * Userscript entry point.
 */
(() => {
  "use strict";

  const teamID = window.location.href.split("/")[4];
  let originalRows = [];

  /**
   * Add the daily races column to the team stats table when the page has loaded.
   */
  window.addEventListener("load", async () => {
    const teamStatsTable = await waitForElm(".table--teamOverview");

    // Retrieve current season information.
    const seasonInfo = NTGLOBALS.ACTIVE_SEASONS.find((s) => {
      const now = Date.now();
      return now >= s.startStamp * 1e3 && now <= s.endStamp * 1e3;
    });
    const DAYS_SINCE_SEASON_START = Math.ceil(
      Math.abs(Date.now() - seasonInfo.startStamp * 1000) /
        (1000 * 60 * 60 * 24)
    );

    // Retrieve team stats.
    const { results: teamStats } = await fetchTeamStats(teamID);

    // Loop through all team members in the table and calculate dailyRaces.
    const dailyRacesAllTime = teamStats.members.reduce((acc, member) => {
      const { displayName, username, joinStamp, played } = member;
      const memberName = displayName || username;
      const joinDate = new Date(joinStamp * 1000);
      const memberDays = Math.ceil(
        Math.abs(Date.now() - joinDate.getTime()) / (1000 * 3600 * 24)
      );
      const dailyRaces = played / memberDays;
      acc[memberName] = dailyRaces.toFixed(0);
      return acc;
    }, {});

    /**
     * Removes the daily races column from the DOM.
     */
    const removeDailyRacesColumn = () => {
      document
        .querySelectorAll(".daily-races-header, .daily-races-column-item")
        .forEach((element) => element.remove());
    };

    /**
     * Adds a daily races column to the team stats table and sorts the table by daily races.
     */
    const addDailyRacesColumn = async () => {
      // Check if daily races column was sorted.
      const oldDailyRacesHeader = document.querySelector(".daily-races-header");
      const wasSorted =
        oldDailyRacesHeader?.classList.contains("table-filter--asc") ||
        oldDailyRacesHeader?.classList.contains("table-filter--desc");
      const sortType = oldDailyRacesHeader?.classList.contains(
        "table-filter--asc"
      )
        ? "asc"
        : "desc";

      // Remove daily races column if it already exists.
      await removeDailyRacesColumn();

      // Add extra daily races header column.
      const dailyRacesHeader = document.createElement("th");
      dailyRacesHeader.classList.add(
        "table-cell",
        "table-cell--lastRace",
        "table-filter",
        "daily-races-header"
      );
      if (wasSorted) {
        dailyRacesHeader.classList.add(`table-filter--${sortType}`);
      }
      dailyRacesHeader.innerHTML = "Daily<br>Races";
      teamStatsTable.querySelector("thead tr").appendChild(dailyRacesHeader);

      /**
       * Sort the daily races column.
       * @param {string} sortType The sort type to use. Either "asc" or "desc".
       */
      const sortDailyRacesColumn = (sortType) => {
        if (originalRows.length === 0) {
          // Store original row order.
          originalRows = Array.from(
            teamStatsTable.querySelectorAll("tbody tr")
          );
        };

        // Sort rows by dailyRaces in descending order.
        const teamStatsTableRows = Array.from(
          teamStatsTable.querySelectorAll("tbody tr")
        );
        const sortedRows = teamStatsTableRows
          .map((row) => {
            const memberName = row.cells[1]
              .querySelector("span")
              .textContent.trim();
            const dailyRaces = parseInt(
              row.cells[dailyRacesHeader.cellIndex].textContent.trim(),
              10
            );
            return { row, memberName, dailyRaces };
          })
          .sort((a, b) => b.dailyRaces - a.dailyRaces)
          .map(({ row }) => row);

        // Revert the order if the sortType is ascending.
        if (sortType === "asc") {
          sortedRows.reverse();
          dailyRacesHeader.classList.remove("table-filter--desc");
          dailyRacesHeader.classList.add("table-filter--asc");
        } else {
          dailyRacesHeader.classList.remove("table-filter--asc");
          dailyRacesHeader.classList.add("table-filter--desc");
        }

        // Remove the sort icon from all other columns.
        Array.from(teamStatsTable.querySelector("thead tr").cells).forEach(
          (cell) => {
            if (cell !== dailyRacesHeader) {
              cell.classList.remove("table-filter--asc", "table-filter--desc");
            }
          }
        );

        // Remove rows and add them back in sorted order.
        teamStatsTable.querySelector("tbody").append(...sortedRows);

        // Restore original order if other columns are clicked.
        Array.from(teamStatsTable.querySelector("thead tr").cells).forEach(
          (cell) => {
            if (cell !== dailyRacesHeader) {
              cell.addEventListener("click", () => {
                // Remove the sort icon.
                dailyRacesHeader.classList.remove(
                  "table-filter--asc",
                  "table-filter--desc"
                );

                // Restore original row order.
                teamStatsTable.querySelector("tbody").append(...originalRows);
                originalRows = [];
              });
            }
          }
        );
      };

      // Loop through all team members and display the daily races.
      const teamStatsTableRows = Array.from(
        teamStatsTable.querySelectorAll("tbody tr")
      );
      teamStatsTableRows.forEach((row) => {
        // Retrieve member name.
        const memberName = row.cells[1]
          .querySelector("span")
          .textContent.trim();

        // Add daily races column.
        const dailyRacesCell = document.createElement("td");
        dailyRacesCell.classList.add(
          "table-cell",
          "table-cell--lastRace",
          "daily-races-column-item"
        );

        // Calculate team stats or season stats based on the table type.
        let dailyRaces = 0;
        if (teamStatsTable.classList.contains("table--teamSeason")) {
          const { played } = teamStats.season.find(
            (member) =>
              member.displayName === memberName ||
              member.username === memberName
          );
          dailyRaces = (played / DAYS_SINCE_SEASON_START).toFixed(0);
        } else {
          dailyRaces = dailyRacesAllTime[memberName];
        }
        dailyRacesCell.textContent = dailyRaces;
        row.appendChild(dailyRacesCell);
      });

      // If sorted sort the columns.
      if (wasSorted) {
        sortDailyRacesColumn(sortType);
      }

      // Add a click handler that sorts the team members by daily races.
      dailyRacesHeader.addEventListener("click", (event) => {
        const elementClasses = event.target.classList;
        sortDailyRacesColumn(
          elementClasses.contains("table-filter--desc") ? "asc" : "desc"
        ); // Switch sort type.
      });
    };

    // Add daily races column.
    await addDailyRacesColumn();

    // Re-load daily races column when the table filter is changed.
    const tableFilterObserver = new MutationObserver(async () => {
      await addDailyRacesColumn();
    });

    // Start observing the element.
    tableFilterObserver.observe(teamStatsTable, { attributes: true });
  });
})();
