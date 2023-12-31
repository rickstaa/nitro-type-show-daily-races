# Nitro Type - Show Daily Races

This repository hosts a userscript that enriches the team roster table on the [Nitro Type](https://www.nitrotype.com/) team page. It introduces an additional column displaying the average daily races completed by each team member within the Nitro Type team. This data proves valuable to team leaders aiming to monitor team member performance and make well-informed choices regarding promotions and demotions.

## Installation

1.  Install a userscript manager for your browser. For example, [Tampermonkey](https://tampermonkey.net/) for Chrome or [Greasemonkey](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) for Firefox.
2.  Go to the [Nitro Type - Show Daily Races](https://greasyfork.org/en/scripts/473519-nitro-type-show-daily-races) script page.
3.  Click the Install button.
4.  Go to your Nitro Type team page and refresh the page.
5.  You should now see a new column in the team roster table that contains the daily races.

## Uninstallation

To uninstall the userscript, simply disable or remove it from your userscript manager.

## How it works

The script works by adding a new column to the team statistics table that shows the average number of daily races per team member. The script calculates this average by dividing the total number of team races by the number of days a team member has been on the team. The data for this calculation is retrieved using the [NitroType API](https://www.nitrotype.com/api/v2).

## Screenshot

![image](https://github.com/rickstaa/nitro-type-show-daily-races/assets/17570430/d42bc612-7b7e-48c3-968d-005b16e242d5)

## Bugs and contributions

If you find a bug or have a suggestion for how to improve the script, please open [an issue](https://github.com/rickstaa/nitro-type-daily-races/issues) or submit a [pull request](https://github.com/rickstaa/nitro-type-daily-races/compare) on GitHub. We welcome contributions from the community and appreciate your feedback 🚀. Please consult the [contribution guidelines](CONTRIBUTING.md) for more information.
