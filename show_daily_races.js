// ==UserScript==
// @name         Nitro Type - Show Daily Races
// @namespace    https://greasyfork.org/en/users/863158-rickstaa
// @version      0.1
// @description  Shows the daily races in the team roster table on the team page.
// @author       Rick Staa
// @match        *://*.nitrotype.com/team/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @license      MIT
// ==/UserScript==

/**
 * Returns the number of days based on the given time string.
 * @param {string} timeString - The time string to parse.
 * @returns {number} The number of days.
 */
const getTimeInDays = (timeString) => {
  let timeComponents = timeString.split(" ");

  // Retrieve the number of days on the team.
  let counter = timeComponents[0] != "a" ? timeComponents[0] : 1;
  let timeKey = timeComponents[1] ? timeComponents[1] : "day";
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
 * Add the daily races column to the team stats table when the page has loaded.
 */
window.addEventListener("load", function () {
  // Retrieve team stats table.
  let teamStatsTable = document.querySelector(
    ".table.table--striped.table--selectable.table--team.table--teamOverview"
  );
  let teamStatsTableHeader = teamStatsTable.querySelector("thead tr");

  // Add extra daily races header column.
  let dailyRacesHeader = document.createElement("th");
  dailyRacesHeader.classList.add(
    "table-cell",
    "table-cell--lastRace",
    "table-filter"
  );
  dailyRacesHeader.innerHTML = "Daily<br>Races";
  teamStatsTableHeader.appendChild(dailyRacesHeader);

  // Find Team Races and Members Since columns.
  let teamRacesColumn = Array.from(teamStatsTableHeader.cells).find((cell) =>
    cell.innerHTML.includes("Team<br>Races")
  ).cellIndex;
  let memberSinceColumn = Array.from(teamStatsTableHeader.cells).find((cell) =>
    cell.innerHTML.includes("Member<br>Since")
  ).cellIndex;

  // Loop through all team members and display the daily races.
  Array.from(teamStatsTable.querySelectorAll("tbody tr")).map((row) => {
    // Calculate daily races.
    let memberDays = getTimeInDays(row.cells[memberSinceColumn].textContent);
    let races = row.cells[teamRacesColumn].textContent.replace(",", "");
    let dailyRaces = races / memberDays;

    // Add daily races column.
    let dailyRacesCell = document.createElement("td");
    dailyRacesCell.classList.add("table-cell", "table-cell--lastRace");
    dailyRacesCell.textContent = dailyRaces.toFixed(0);
    row.appendChild(dailyRacesCell);
  });

  // Add a click handler that sorts the team members by daily races.
  dailyRacesHeader.addEventListener("click", function () {
    let rows = Array.from(teamStatsTable.querySelectorAll("tbody tr"));

    // Sort rows by dailyRaces in descending order.
    rows.sort(function (a, b) {
      let aDailyRaces = parseFloat(
        a.cells[teamStatsTableHeader.cells.length - 1].textContent
      );
      let bDailyRaces = parseFloat(
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
