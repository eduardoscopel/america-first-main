<script>
  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 
    import Button, { Group, Label } from '@smui/button';
    import { Icon } from '@smui/tab';
    import { gotoManager, round } from '$lib/utils/helper';
    import { getManagerRecords } from '$lib/utils/helper';
    import { managerrecords } from '$lib/stores';


    export let recordManID, firstYear, currentYear, managerRecords;

    let showEmpty = new Boolean (false);
    let emptyMessage;
    let selection = 'regular'; 
    let recordPrefix;
    let masterSelection = 'alltime';
    let masterPrefix;
    let selectedYear = currentYear;

    let weekBests, weekWorsts, periodBests, periodWorsts, blowoutBests, blowoutWorsts, narrowBests, narrowWorsts, playerWeekBests, playerWeekMissedBests, playerPeriodBests, headToHeads;
    let headShowTies = false;
    let headShowTiesEPE = false;
    const positionRecords = {
        week_Top: {},
        period_Top: {},
    };

    const positionsArray = [];

    const refreshRecords = async () => {
        const newRecords = await getManagerRecords(managerrecords);
        managerrecords.update(() => newRecords);
        managerRecords = newRecords;

        for(const position in managerRecords.playerPositionRecords.alltime.regularSeason[recordManID]) {
            if(!positionsArray.includes(position) && managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][position].week_Top.length > 0) {
                positionsArray.push(position);
                positionRecords.week_Top[position] = [];
            }
            if(managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][position].period_Top.length > 0) {
                positionRecords.period_Top[position] = [];
            }
        }

        if(displayStats == 'regular') {
            setRegularTable(managerRecords, displayType, displayYear);
        } else if(displayStats == 'playoffs') {
            setPlayoffsTable(managerRecords, displayType, displayYear);
        } else if(displayStats == 'combined') {
            setCombinedTable(managerRecords, displayType, displayYear);
        }
    }
  
    refreshRecords(managerrecords);

    const setRegularTable = (managerRecords, displayType, displayYear) => {
        recordPrefix = "Regular Season";
        selection = 'regular';
        showEmpty = false;
        headToHeads = [];
        headShowTies = false;
        
        if(displayType == 'alltime') {
            masterPrefix = "All-Time";
            masterSelection = 'alltime';
            weekBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.alltime.regularSeason[recordManID].narrow_Worst;
            playerWeekBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.regularSeason[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.regularSeason.alltime[recordManID]) {
                if(managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);

        } else if(displayType == 'yearly') {
            masterPrefix = displayYear;
            masterSelection = 'yearly';
            weekBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.years[displayYear].regularSeason[recordManID].narrow_Worst;
            playerWeekBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.regularSeason[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.regularSeason.years[displayYear][recordManID]) {
                if(managerRecords.headToHeadRecords.regularSeason.years[displayYear][recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.regularSeason.years[displayYear][recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.regularSeason.years[displayYear][recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.regularSeason.years[displayYear][recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);
        }
    }

    const setPlayoffsTable = (managerRecords, displayType, displayYear) => {
        recordPrefix = "Playoffs";
        selection = 'playoffs';
        headToHeads = [];
        headShowTies = false;

        if(displayType == 'alltime' && managerRecords.managerRecordArrays.alltime.playoffs[recordManID]) {
            showEmpty = false;
            masterPrefix = "All-Time";
            masterSelection = 'alltime';
            weekBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.alltime.playoffs[recordManID].narrow_Worst;  
            playerWeekBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.playoffs[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.alltime.playoffs[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.alltime.playoffs[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.playoffs.alltime[recordManID]) {
                if(managerRecords.headToHeadRecords.playoffs.alltime[recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.playoffs.alltime[recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.playoffs.alltime[recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.playoffs.alltime[recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);
        } else if(displayType == 'yearly' && managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID]) {
            showEmpty = false;
            masterPrefix = displayYear;
            masterSelection = 'yearly';
            weekBests = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID].narrow_Worst;
            playerWeekBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].playoffs.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].playoffs.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.playoffs[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.playoffs.years[displayYear][recordManID]) {
                if(managerRecords.headToHeadRecords.playoffs.years[displayYear][recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.playoffs.years[displayYear][recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.playoffs.years[displayYear][recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.playoffs.years[displayYear][recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);
        } else if(displayType == 'alltime' && !managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID]) {
            showEmpty = true;
            emptyMessage = "No Playoff Records Yet...";
            masterSelection = 'alltime';
            masterPrefix = "All-Time";
        } else if(displayType == 'yearly' && !managerRecords.managerRecordArrays.years[displayYear].playoffs[recordManID]) {
            showEmpty = true;
            emptyMessage = `No Playoff Records for ${displayYear}...`;
            masterSelection = 'yearly';
            masterPrefix = displayYear;
        }
    }

    const setCombinedTable = (managerRecords, displayType, displayYear) => {
        recordPrefix = "Combined";
        selection = 'combined';
        showEmpty = false;
        headToHeads = [];
        headShowTies = false;

        if(displayType == 'alltime') {
            masterPrefix = "All-Time";
            masterSelection = 'alltime';
            weekBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.alltime.combined[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.alltime.combined[recordManID].narrow_Worst;
            playerWeekBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.combined[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.alltime.combined[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.alltime.combined[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.combined.alltime[recordManID]) {
                if(managerRecords.headToHeadRecords.combined.alltime[recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.combined.alltime[recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.combined.alltime[recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.combined.alltime[recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);
        } else if(displayType == 'yearly') {
            masterPrefix = displayYear;
            masterSelection = 'yearly';
            weekBests = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].week_Best;
            weekWorsts = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].week_Worst;
            periodBests = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].period_Best;
            periodWorsts = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].period_Worst;
            blowoutBests = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].blowout_Best;
            blowoutWorsts = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].blowout_Worst;
            narrowBests = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].narrow_Best;
            narrowWorsts = managerRecords.managerRecordArrays.years[displayYear].combined[recordManID].narrow_Worst;
            playerWeekBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].week_Best;
            playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].week_MissedBest;
            playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].period_Best;

            for(const position in managerRecords.playerPositionRecords.alltime.combined[recordManID]) {
                positionRecords.week_Top[position] = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID][position].week_Top;
                positionRecords.period_Top[position] = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID][position].period_Top;
            }

            for(const opponent in managerRecords.headToHeadRecords.comined.years[displayYear][recordManID]) {
                if(managerRecords.headToHeadRecords.combined.years[displayYear][recordManID][opponent].winPerc >= 0) {
                    headToHeads.push(managerRecords.headToHeadRecords.combined.years[displayYear][recordManID][opponent]);
                }
                if(managerRecords.headToHeadRecords.combined.years[displayYear][recordManID][opponent].ties > 0) {
                    headShowTies = true;
                }
                if(managerRecords.headToHeadRecords.combined.years[displayYear][recordManID][opponent].epeTies > 0) {
                    headShowTiesEPE = true;
                }
            }
            headToHeads = headToHeads.sort((a, b) => b.winPerc - a.winPerc);
        }
    }

    let displayStats;
    const changeSelection = (selection) => {
        displayStats = selection;
        refreshRecords(displayStats);
    }
    $: changeSelection(selection);

    let displayType;
    const changeMasterSelection = (masterSelection) => {
        displayType = masterSelection;
        refreshRecords(displayType);
    }
    $: changeMasterSelection(masterSelection);

    let displayYear;
    const changeYear = (selectedYear) => {
        displayYear = selectedYear;
        refreshRecords(displayYear);
    }
    $: changeYear(selectedYear);

    let displayWeekRecord = 'best';
    const changeWeekRecord = (weekType) => {
        if(weekType == 'best') {
            displayWeekRecord = 'best';
        } else if(weekType == 'worst') {
            displayWeekRecord = 'worst';
        }
    }
    $: changeWeekRecord(displayWeekRecord);

    let displaySeasonRecord = 'best';
    const changeSeasonRecord = (seasonType) => {
        if(seasonType == 'best') {
            displaySeasonRecord = 'best';
        } else if(seasonType == 'worst') {
            displaySeasonRecord = 'worst';
        }
    }
    $: changeSeasonRecord(displaySeasonRecord);

    let displayBlowoutRecord = 'won';
    const changeBlowoutRecord = (blowoutType) => {
        if(blowoutType == 'won') {
            displayBlowoutRecord = 'won';
        } else if(blowoutType == 'lost') {
            displayBlowoutRecord = 'lost';
        }
    }
    $: changeBlowoutRecord(displayBlowoutRecord);

    let displayNailbiterRecord = 'won';
    const changeNailbiterRecord = (nailbiterType) => {
        if(nailbiterType == 'won') {
            displayNailbiterRecord = 'won';
        } else if(nailbiterType == 'lost') {
            displayNailbiterRecord = 'lost';
        }
    }
    $: changeNailbiterRecord(displayNailbiterRecord);

    let displayPlayerRecord = 'week';
    const changePlayerRecord = (playerType) => {
        if(playerType == 'week') {
            displayPlayerRecord = 'week';
        } else if(playerType == 'season') {
            displayPlayerRecord = 'season';
        } else if(playerType == 'bench') {
            displayPlayerRecord = 'bench';
        } else if(playerType == 'position') {
            displayPlayerRecord = 'position';
        }
    }
    $: changePlayerRecord(displayPlayerRecord);

    let displayPositionRecord = 'RB';
    const changePositionRecord = (positionType) => {
        displayPositionRecord = positionType;
    }
    $: changePositionRecord(displayPositionRecord);

</script>

<!-- svelte-ignore non-top-level-reactive-declaration -->
<style>

    :global(.header) {
        text-align: center;
    }

    :global(.recordTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em;
    }

    .playerAvatar {
		vertical-align: middle;
		height: 45px;
		width: 45px;
		background-position: center;
		background-repeat: no-repeat;
		background-size: auto 45px;
	}

    .playerInfo {
        display: inline-block;
        /* display: flex; */
        padding: 0 0 0 20px;
    }

    .showEmpty {
        text-align: center;
    }

    .fantasyTeamName {
        font-style: italic;
        color: #999;
        font-size: 0.8em;
        line-height: 1.1em;
    }

    .fullFlex {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin: 1em auto 5em;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0;
        width: 100%;
    }

    :global(.cellName) {
        cursor: pointer;
        line-height: 1.2em;
    }

    h2 {
        text-align: center;
    }

    .yearText {
        flex-grow: 1;
        text-align: center;
        font-size: 2.25em;
        font-weight: 220;
    }

    .center {
        text-align: center;
    }

    .yearContainer {
        display: flex;
        width: 95%;
        max-width: 600px;
        margin: 0 auto;
        align-items: center;
    }

    :global(.changeYear) {
        font-size: 3em;
        cursor: pointer;
        color: #888;
    }

    :global(.changeYear:hover) {
        color: #00316b;
    }

    .spacer {
        width: 48px;
    }

        /* Start button resizing */

    @media (max-width: 540px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.6em;
        }
    }

    @media (max-width: 415px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.5em;
            padding: 0 6px;
        }
    }

    @media (max-width: 315px) {
        :global(.buttonHolder .selectionButtons) {
            font-size: 0.45em;
            padding: 0 3px;
        }
    }

    /* End button resizing */

    /* Start record table resizing */

    @media (max-width: 510px) {
        :global(.recordTable th) {
            font-size: 0.8em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.8em;
            padding: 1px 12px;
        }
    }

    @media (max-width: 435px) {
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
        :global(.rank) {
            padding: 1px 0 1px 5px !important;
        }
    }

    @media (max-width: 420px) {
        :global(.recordTable th) {
            font-size: 0.6em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.6em;
            padding: 1px 12px;
        }
    }

    @media (max-width: 330px) {
        :global(.recordTable th) {
            font-size: 0.5em;
            padding: 1px 5px;
        }
        :global(.recordTable td) {
            font-size: 0.5em;
            padding: 1px 8px;
        }
    }

    /* END record table resizing */

    .headerRow {
        position: relative;
        display: inline-flex;
        height: 2em;
        width: 100%;
        margin: 1em 0;
        align-items: center;
        justify-content: space-around;
    }

    .headerLabel {
        position: relative;
        display: inline-flex;
        color: var(--gcPlayRowText);
        font-weight: 420;
        font-size: 2em;
        justify-content: center;
    }

    .recordsWrap {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        width: 100%;
        justify-content: center;
    }

    .columnWrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 48%;
        padding: 1%;
        align-items: center;
    }

    .mainBase {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        height: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
        background-color: var(--gcComponent);
        border-radius: 50px;
    }

    .rankingsWrapper {
        width: 100%;
        margin: 5% auto;
        height: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
    }

    .headingContainer {
        display: inline-flex;
        position: relative;
        width: 100%;
        height: 7em;
        background-color: var(--gcBox);
        align-items: center;
        justify-content: center;
        box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    .headingText {
        text-align: center;
        font-size: 2.25em;
        font-weight: 450;
        color: var(--gcPlayRowText);
    }

</style>

<div class="rankingsWrapper">
    <div class="mainBase">
        <div class="buttonHolder">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changeMasterSelection('alltime')} variant="{masterSelection == 'alltime' ? "raised" : "outlined"}">
                    <Label>All-Time</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeMasterSelection('yearly')} variant="{masterSelection == 'yearly' ? "raised" : "outlined"}">
                    <Label>Yearly</Label>
                </Button>
            </Group>
        </div>
        <div class="headingContainer">
            {#if masterSelection == 'yearly' && displayYear > firstYear}
                <Icon class="material-icons changeYear" on:click={() => changeYear(displayYear - 1)}>chevron_left</Icon>
            {:else}
                <span class="spacer" />
            {/if}  
            <div class="headingText">{masterPrefix} Records</div>
            {#if masterSelection == 'yearly' && displayYear < currentYear}
                <Icon class="material-icons changeYear" on:click={() => changeYear(displayYear + 1)}>chevron_right</Icon>
            {:else}
                <span class="spacer" />
            {/if}  
        </div>
        <div class="buttonHolder">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changeSelection('regular')} variant="{selection == 'regular' ? "raised" : "outlined"}">
                    <Label>Regular Season</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeSelection('playoffs')} variant="{selection == 'playoffs' ? "raised" : "outlined"}">
                    <Label>Playoffs</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeSelection('combined')} variant="{selection == 'combined' ? "raised" : "outlined"}">
                    <Label>Combined</Label>
                </Button>
            </Group>
        </div>
        <div class="headerRow">
            {#if masterSelection == 'alltime'}
                <div class="headerLabel">Weeks</div>
                <div class="headerLabel">Seasons</div>
            {:else}
                <div class="headerLabel" style="justify-content: center">Weeks</div>
            {/if}
        </div>
        <div class="recordsWrap">
            <div class="columnWrap" style="{masterSelection == 'yearly' ? "width: 98%;" : null}">
                <div class="buttonHolder">
                    <Group variant="outlined">
                        <Button class="selectionButtons" on:click={() => changeWeekRecord('best')} variant="{displayWeekRecord == 'best' ? "raised" : "outlined"}">
                            <Label>Best</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changeWeekRecord('worst')} variant="{displayWeekRecord == 'worst' ? "raised" : "outlined"}">
                            <Label>Worst</Label>
                        </Button>
                    </Group>
                </div>
                {#if showEmpty == false}
                    {#if displayWeekRecord == 'best'}
                        {#if weekBests && weekBests.length}
                            <DataTable class="recordTable" style="width: 450px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=4>
                                            <p>
                                                Personal Best Week Scores<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>  
                                    </Row>
                                    <Row>
                                        <Cell class="header"></Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">PF</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each weekBests as weekBest, ix}
                                        <Row>
                                            <Cell>{ix + 1}</Cell>
                                            {#if masterSelection == 'alltime'}				
                                                <Cell class="center">{weekBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{weekBest.week}</Cell>
                                            <Cell class="center">{round(weekBest.fpts)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayWeekRecord == 'worst'}
                        {#if weekWorsts && weekWorsts.length}
                            <DataTable class="recordTable" style="width: 450px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=4>
                                            <p>
                                                Personal Worst Week Scores<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>  
                                    </Row>
                                    <Row>
                                        <Cell class="header"></Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">PF</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each weekWorsts as weekWorst, ix}
                                        <Row>
                                            <Cell>{ix + 1}</Cell>
                                            {#if masterSelection == 'alltime'}				
                                                <Cell class="center">{weekWorst.year}</Cell>
                                            {/if}
                                            <Cell class="center">{weekWorst.week}</Cell>
                                            <Cell class="center">{round(weekWorst.fpts)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {/if}
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}  
            </div>
            {#if masterSelection == 'alltime'}
                <div class="columnWrap">
                    <div class="buttonHolder">
                        <Group variant="outlined">
                            <Button class="selectionButtons" on:click={() => changeSeasonRecord('best')} variant="{displaySeasonRecord == 'best' ? "raised" : "outlined"}">
                                <Label>Best</Label>
                            </Button>
                            <Button class="selectionButtons" on:click={() => changeSeasonRecord('worst')} variant="{displaySeasonRecord == 'worst' ? "raised" : "outlined"}">
                                <Label>Worst</Label>
                            </Button>
                        </Group>
                    </div>
                    {#if showEmpty == false}
                        {#if displaySeasonRecord == 'best'}
                            {#if periodBests && periodBests.length}
                                <DataTable class="recordTable" style="width: 450px;">
                                    <Head>
                                        <Row>
                                            <Cell class="header" colspan=4>
                                                <p>
                                                    Personal Best Season-Long Scores<br>
                                                    {recordPrefix} 
                                                </p>
                                            </Cell>  
                                        </Row>
                                        <Row>
                                            <Cell class="header"></Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="header">Year</Cell>
                                            {/if}
                                            <Cell class="header">PF</Cell>
                                            <Cell class="header">PPG</Cell>
                                        </Row>
                                    </Head>
                                    <Body>
                                        {#each periodBests as periodBest, ix}
                                            <Row>
                                                <Cell>{ix + 1}</Cell>
                                                {#if masterSelection == 'alltime'}				
                                                    <Cell class="center">{periodBest.year}</Cell>
                                                {/if}
                                                <Cell class="center">{round(periodBest.fpts)}</Cell>
                                                <Cell class="center">{round(periodBest.fptspg)}</Cell>
                                            </Row>
                                        {/each}
                                    </Body>
                                </DataTable>
                            {/if}
                        {:else if displaySeasonRecord == 'worst'}
                            {#if periodWorsts && periodWorsts.length}
                                <DataTable class="recordTable" style="width: 450px;">
                                    <Head>
                                        <Row>
                                            <Cell class="header" colspan=4>
                                                <p>
                                                    Personal Worst Season-Long Scores<br>
                                                    {recordPrefix} 
                                                </p>
                                            </Cell>  
                                        </Row>
                                        <Row>
                                            <Cell class="header"></Cell>
                                            {#if masterSelection == 'alltime'}				
                                                <Cell class="header">Year</Cell>
                                            {/if}
                                            <Cell class="header">PF</Cell>
                                            <Cell class="header">PPG</Cell>
                                        </Row>
                                    </Head>
                                    <Body>
                                        {#each periodWorsts as periodWorst, ix}
                                            <Row>
                                                <Cell>{ix + 1}</Cell>
                                                {#if masterSelection == 'alltime'}				
                                                    <Cell class="center">{periodWorst.year}</Cell>
                                                {/if}
                                                <Cell class="center">{round(periodWorst.fpts)}</Cell>
                                                <Cell class="center">{round(periodWorst.fptspg)}</Cell>
                                            </Row>
                                        {/each}
                                    </Body>
                                </DataTable>
                            {/if}
                        {/if}
                    {:else}
                        <div class="showEmpty">{emptyMessage}</div>
                    {/if}                
                </div>
            {/if}
        </div>
        <div class="headerRow">
            <div class="headerLabel">Blowouts</div>
            <div class="headerLabel">Nailbiters</div>
        </div>
        <div class="recordsWrap">
            <div class="columnWrap">
                <div class="buttonHolder">
                    <Group variant="outlined">
                        <Button class="selectionButtons" on:click={() => changeBlowoutRecord('won')} variant="{displayBlowoutRecord == 'won' ? "raised" : "outlined"}">
                            <Label>Won</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changeBlowoutRecord('lost')} variant="{displayBlowoutRecord == 'lost' ? "raised" : "outlined"}">
                            <Label>Lost</Label>
                        </Button>
                    </Group>
                </div>
                {#if showEmpty == false}
                    {#if displayBlowoutRecord == 'won'}
                        {#if blowoutBests && blowoutBests.length}
                            <DataTable class="recordTable" style="width: 550px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Blowouts Won<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">Loser</Cell>
                                        <Cell class="header">PA</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">Diff</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each blowoutBests as blowoutBest, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <Cell class="center" style="background-color: #0182c326;">{round(blowoutBest.fpts)}</Cell>
                                            <Cell class="cellName" style="background-color: #7a7a7a33;" on:click={() => gotoManager(blowoutBest.againstRecordManID)}>
                                                {blowoutBest.againstManager.realname}
                                                {#if masterSelection == 'yearly'}
                                                    <div class="fantasyTeamName">({blowoutBest.againstManager.name})</div>
                                                {/if}
                                            </Cell>
                                            <Cell class="center" style="background-color: #6a6a6a33;">{round(blowoutBest.fptsAgainst)}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{blowoutBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{blowoutBest.week}</Cell>
                                            <Cell class="center">{round(blowoutBest.matchDifferential)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayBlowoutRecord == 'lost'}
                        {#if blowoutWorsts && blowoutWorsts.length}
                            <DataTable class="recordTable" style="width: 550px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Blowouts Lost<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">Winner</Cell>
                                        <Cell class="header">PA</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">Diff</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each blowoutWorsts as blowoutWorst, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <Cell class="center" style="background-color: #6a6a6a33;">{round(blowoutWorst.fpts)}</Cell>
                                            <Cell class="cellName" style="background-color: #229bd924;" on:click={() => gotoManager(blowoutWorst.againstRecordManID)}>
                                                {blowoutWorst.againstManager.realname}
                                                {#if masterSelection == 'yearly'}
                                                    <div class="fantasyTeamName">({blowoutWorst.againstManager.name})</div>
                                                {/if}
                                            </Cell>
                                            <Cell class="center" style="background-color: #0182c326;">{round(blowoutWorst.fptsAgainst)}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{blowoutWorst.year}</Cell>
                                            {/if}
                                            <Cell class="center">{blowoutWorst.week}</Cell>
                                            <Cell class="center">{round(blowoutWorst.matchDifferential)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {/if}
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}    
            </div>
            <div class="columnWrap">
                <div class="buttonHolder">
                    <Group variant="outlined">
                        <Button class="selectionButtons" on:click={() => changeNailbiterRecord('won')} variant="{displayNailbiterRecord == 'won' ? "raised" : "outlined"}">
                            <Label>Won</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changeNailbiterRecord('lost')} variant="{displayNailbiterRecord == 'lost' ? "raised" : "outlined"}">
                            <Label>Lost</Label>
                        </Button>
                    </Group>
                </div>
                {#if showEmpty == false}
                    {#if displayNailbiterRecord == 'won'}
                        {#if narrowBests && narrowBests.length}
                            <DataTable class="recordTable" style="width: 550px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Nailbiters Won<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">Loser</Cell>
                                        <Cell class="header">PF</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">Diff</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each narrowBests as narrowBest, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <Cell class="center" style="background-color: #0182c326;">{round(narrowBest.fpts)}</Cell>
                                            <Cell class="cellName" style="background-color: #7a7a7a33;" on:click={() => gotoManager(narrowBest.againstRecordManID)}>
                                                {narrowBest.againstManager.realname}
                                                {#if masterSelection == 'yearly'}
                                                    <div class="fantasyTeamName">({narrowBest.againstManager.name})</div>
                                                {/if}
                                            </Cell>
                                            <Cell class="center" style="background-color: #6a6a6a33;">{round(narrowBest.fptsAgainst)}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{narrowBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{narrowBest.week}</Cell>
                                            <Cell class="center">{round(narrowBest.matchDifferential)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayNailbiterRecord == 'lost'}
                        {#if narrowWorsts && narrowWorsts.length}
                            <DataTable class="recordTable" style="width: 550px;">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Nailbiters Lost<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">Winner</Cell>
                                        <Cell class="header">PA</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">Diff</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each narrowWorsts as narrowWorst, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <Cell class="center" style="background-color: #6a6a6a33;">{round(narrowWorst.fpts)}</Cell>
                                            <Cell class="cellName" style="background-color: #229bd924;" on:click={() => gotoManager(narrowWorst.againstRecordManID)}>
                                                {narrowWorst.againstManager.realname}
                                                {#if masterSelection == 'yearly'}
                                                    <div class="fantasyTeamName">({narrowWorst.againstManager.name})</div>
                                                {/if}
                                            </Cell>
                                            <Cell class="center" style="background-color: #0182c326;">{round(narrowWorst.fptsAgainst)}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{narrowWorst.year}</Cell>
                                            {/if}
                                            <Cell class="center">{narrowWorst.week}</Cell>
                                            <Cell class="center">{round(narrowWorst.matchDifferential)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {/if}
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}    
            </div>
        </div>
        <div class="headerRow">
            <div class="headerLabel" style="justify-content: center">Players</div>
        </div>
        <div class="recordsWrap">
            <div class="columnWrap" style="width: 98%;">
                <div class="buttonHolder">
                    <Group variant="outlined">
                        <Button class="selectionButtons" on:click={() => changePlayerRecord('week')} variant="{displayPlayerRecord == 'week' ? "raised" : "outlined"}">
                            <Label>Week</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changePlayerRecord('season')} variant="{displayPlayerRecord == 'season' ? "raised" : "outlined"}">
                            <Label>Season</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changePlayerRecord('bench')} variant="{displayPlayerRecord == 'bench' ? "raised" : "outlined"}">
                            <Label>Benchwarmers</Label>
                        </Button>
                        <Button class="selectionButtons" on:click={() => changePlayerRecord('position')} variant="{displayPlayerRecord == 'position' ? "raised" : "outlined"}">
                            <Label>Positions</Label>
                        </Button>
                    </Group>
                </div>
                {#if showEmpty == false}
                    {#if displayPlayerRecord == 'week'}
                        {#if playerWeekBests && playerWeekBests.length}
                            <DataTable class="recordTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Week Scores - Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <div class="playerAvatar playerInfo" />
                                        <Cell class="header">Player</Cell>
                                        <Cell class="header">POS</Cell>
                                        <Cell class="header">NFL Team</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">PF</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each playerWeekBests as playerWeekBest, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <div class="playerAvatar playerInfo" style="{playerWeekBest.avatar}" />
                                            <Cell class="left">{playerWeekBest.playerInfo.fn} {playerWeekBest.playerInfo.ln}</Cell>
                                            <Cell class="center">{playerWeekBest.playerInfo.pos}</Cell>
                                            <Cell class="center">{playerWeekBest.playerInfo.t}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{playerWeekBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{playerWeekBest.week}</Cell>
                                            <Cell class="center">{round(playerWeekBest.playerPoints)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayPlayerRecord == 'season'}
                        {#if playerPeriodBests && playerPeriodBests.length}
                            <DataTable class="recordTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=10>
                                            <p>
                                                Top 10 Season-Long Scores – Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <div class="playerAvatar playerInfo" />
                                        <Cell class="header">Player</Cell>
                                        <Cell class="header">POS</Cell>
                                        <Cell class="header">NFL Team</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Led Team</Cell>
                                        <Cell class="header">Avg Rank</Cell>
                                        <Cell class="header">Starts</Cell>
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">PPG</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each playerPeriodBests as playerPeriodBest, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <div class="playerAvatar playerInfo" style="{playerPeriodBest.avatar}" />
                                            <Cell class="left">{playerPeriodBest.playerInfo.fn} {playerPeriodBest.playerInfo.ln}</Cell>
                                            <Cell class="center">{playerPeriodBest.playerInfo.pos}</Cell>
                                            <Cell class="center">{playerPeriodBest.playerInfo.t}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{playerPeriodBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{playerPeriodBest.topStarters}</Cell>
                                            <Cell class="center">{round(playerPeriodBest.starterRankAVG)}</Cell>
                                            <Cell class="center">{playerPeriodBest.weeksStarted} / {playerPeriodBest.weeksOwned}</Cell>
                                            <Cell class="center">{round(playerPeriodBest.playerPoints)}</Cell>
                                            <Cell class="center">{round(playerPeriodBest.playerPPStart)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayPlayerRecord == 'bench'}
                        {#if playerWeekMissedBests && playerWeekMissedBests.length}
                            <DataTable class="recordTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=7>
                                            <p>
                                                Top 10 Benchwarmers – Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <div class="playerAvatar playerInfo" /> 
                                        <Cell class="header">Player</Cell>
                                        <Cell class="header">POS</Cell>
                                        <Cell class="header">NFL Team</Cell>
                                        {#if masterSelection == 'alltime'}
                                            <Cell class="header">Year</Cell>
                                        {/if}
                                        <Cell class="header">Week</Cell>
                                        <Cell class="header">PF</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    {#each playerWeekMissedBests as playerWeekMissedBest, ix}
                                        <Row>
                                            <Cell class="rank">{ix + 1}</Cell>
                                            <div class="playerAvatar playerInfo" style="{playerWeekMissedBest.avatar}" />
                                            <Cell class="left">{playerWeekMissedBest.playerInfo.fn} {playerWeekMissedBest.playerInfo.ln}</Cell>
                                            <Cell class="center">{playerWeekMissedBest.playerInfo.pos}</Cell>
                                            <Cell class="center">{playerWeekMissedBest.playerInfo.t}</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="center">{playerWeekMissedBest.year}</Cell>
                                            {/if}
                                            <Cell class="center">{playerWeekMissedBest.week}</Cell>
                                            <Cell class="center">{round(playerWeekMissedBest.benchPoints)}</Cell>
                                        </Row>
                                    {/each}
                                </Body>
                            </DataTable>
                        {/if}
                    {:else if displayPlayerRecord == 'position'}
                        <div class="buttonHolder">
                            <Group variant="outlined">
                                {#each positionsArray as position}
                                    <Button class="selectionButtons" on:click={() => changePositionRecord(position)} variant="{displayPositionRecord == position ? "raised" : "outlined"}">
                                        <Label>{position}</Label>
                                    </Button>
                                {/each}
                            </Group>
                        </div>
                        {#if showEmpty == false}
                            {#if positionRecords.week_Top[displayPositionRecord] && positionRecords.week_Top[displayPositionRecord].length}
                                <DataTable class="recordTable">
                                    <Head>
                                        <Row>
                                            <Cell class="header" colspan=6>
                                                <p>
                                                    Top 10 Week Scores - {displayPositionRecord}<br>
                                                    {recordPrefix} 
                                                </p>
                                            </Cell>                  
                                        </Row>
                                        <Row>
                                            <Cell class="header rank"></Cell>
                                            <div class="playerAvatar playerInfo" />
                                            <Cell class="header">Player</Cell>
                                            <Cell class="header">NFL Team</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="header">Year</Cell>
                                            {/if}
                                            <Cell class="header">Week</Cell>
                                            <Cell class="header">PF</Cell>
                                        </Row>
                                    </Head>
                                    <Body>
                                        {#each positionRecords.week_Top[displayPositionRecord] as positionPlayer, ix}
                                            <Row>
                                                <Cell class="rank">{ix + 1}</Cell>
                                                <div class="playerAvatar playerInfo" style="{positionPlayer.avatar}" />
                                                <Cell class="left">{positionPlayer.playerInfo.fn} {positionPlayer.playerInfo.ln}</Cell>
                                                <Cell class="center">{positionPlayer.playerInfo.t}</Cell>
                                                {#if masterSelection == 'alltime'}
                                                    <Cell class="center">{positionPlayer.year}</Cell>
                                                {/if}
                                                <Cell class="center">{positionPlayer.week}</Cell>
                                                <Cell class="center">{round(positionPlayer.playerPoints)}</Cell>
                                            </Row>
                                        {/each}
                                    </Body>
                                </DataTable>
                            {/if}
                            {#if positionRecords.period_Top[displayPositionRecord] && positionRecords.period_Top[displayPositionRecord].length}
                                <DataTable class="recordTable">
                                    <Head>
                                        <Row>
                                            <Cell class="header" colspan=9>
                                                <p>
                                                    Top 10 Season-Long Scores – {displayPositionRecord}<br>
                                                    {recordPrefix} 
                                                </p>
                                            </Cell>                  
                                        </Row>
                                        <Row>
                                            <Cell class="header rank"></Cell>
                                            <div class="playerAvatar playerInfo" />
                                            <Cell class="header">Player</Cell>
                                            <Cell class="header">NFL Team</Cell>
                                            {#if masterSelection == 'alltime'}
                                                <Cell class="header">Year</Cell>
                                            {/if}
                                            <Cell class="header">Led Team</Cell>
                                            <Cell class="header">Avg Rank</Cell>
                                            <Cell class="header">Starts</Cell>
                                            <Cell class="header">PF</Cell>
                                            <Cell class="header">PPG</Cell>
                                        </Row>
                                    </Head>
                                    <Body>
                                        {#each positionRecords.period_Top[displayPositionRecord] as positionPlayer, ix}
                                            <Row>
                                                <Cell class="rank">{ix + 1}</Cell>
                                                <div class="playerAvatar playerInfo" style="{positionPlayer.avatar}" />
                                                <Cell class="left">{positionPlayer.playerInfo.fn} {positionPlayer.playerInfo.ln}</Cell>
                                                <Cell class="center">{positionPlayer.playerInfo.t}</Cell>
                                                {#if masterSelection == 'alltime'}
                                                    <Cell class="center">{positionPlayer.year}</Cell>
                                                {/if}
                                                <Cell class="center">{positionPlayer.topStarters}</Cell>
                                                <Cell class="center">{round(positionPlayer.starterRankAVG)}</Cell>
                                                <Cell class="center">{positionPlayer.weeksStarted} / {positionPlayer.weeksOwned}</Cell>
                                                <Cell class="center">{round(positionPlayer.playerPoints)}</Cell>
                                                <Cell class="center">{round(positionPlayer.playerPPStart)}</Cell>
                                            </Row>
                                        {/each}
                                    </Body>
                                </DataTable>
                            {/if}
                        {/if}
                    {/if}
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}    
            </div>
        </div>
        <div class="headerRow">
            <div class="headerLabel" style="justify-content: center">Head to Head</div>
        </div>
        <div class="recordsWrap">
            <div class="columnWrap" style="width: 98%;">
                {#if showEmpty == false}
                    {#if headToHeads && headToHeads.length}
                        <DataTable class="recordTable">
                            <Head>
                                <Row>
                                    <Cell class="header" colspan=13>
                                        <p>
                                            Records Against Other Managers<br>
                                            {recordPrefix} 
                                        </p>
                                    </Cell>  
                                </Row>
                                <Row>
                                    <Cell class="header"></Cell>
                                    <Cell class="header">Manager</Cell>
                                    <Cell class="header">Win %</Cell>
                                    <Cell class="header">W</Cell>
                                    {#if headShowTies == true}
                                        <Cell class="header">T</Cell>
                                    {/if}
                                    <Cell class="header">L</Cell>
                                    <Cell class="header">EPE Win %</Cell>
                                    <Cell class="header">EPE W</Cell>
                                    {#if headShowTiesEPE == true}
                                        <Cell class="header">EPE T</Cell>
                                    {/if}
                                    <Cell class="header">EPE L</Cell>
                                    <Cell class="header">PF (PPG)</Cell>
                                    <Cell class="header">PA (PPG)</Cell>
                                    <Cell class="header">Diff</Cell>
                                </Row>
                            </Head>
                            <Body>
                                {#each headToHeads as opponent, ix}
                                    <Row>
                                        <Cell>{ix + 1}</Cell>
                                        <Cell class="cellName" on:click={() => gotoManager(opponent.againstRecordManID)}>
                                            {opponent.againstManager.realname}
                                            {#if masterSelection == 'yearly'}
                                                <div class="fantasyTeamName">({opponent.againstManager.name})</div>
                                            {/if}
                                        </Cell>
                                        <Cell class="center">{round(opponent.winPerc)}</Cell>
                                        <Cell class="center">{opponent.wins}</Cell>
                                        {#if headShowTies == true}
                                            <Cell class="center">{opponent.ties}</Cell>
                                        {/if}
                                        <Cell class="center">{opponent.losses}</Cell>
                                        <Cell class="center">{round(opponent.epePerc)}</Cell>
                                        <Cell class="center">{opponent.epeWins}</Cell>
                                        {#if headShowTiesEPE == true}
                                            <Cell class="center">{opponent.epeTies}</Cell>
                                        {/if}
                                        <Cell class="center">{opponent.epeLosses}</Cell>
                                        <Cell class="center">{round(opponent.fpts)}  <div style="font-size: 0.9em">({round(opponent.fptspg)})</div></Cell>
                                        <Cell class="center">{round(opponent.fptsAgainst)}  <div style="font-size: 0.9em">({round(opponent.fptsAgainstPg)})</div></Cell>
                                        <Cell class="center">{round(opponent.fpts - opponent.fptsAgainst)}</Cell>
                                    </Row>
                                {/each}
                            </Body>
                        </DataTable>
                    {/if}
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}   
            </div>
        </div>
    </div>
</div>