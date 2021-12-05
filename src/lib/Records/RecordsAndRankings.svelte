<script>
    import Button, { Group, Label } from '@smui/button';
    import BarChart from '../BarChart.svelte'
    import { generateGraph, gotoManager, round, managers, nflTeams } from '$lib/utils/helper';
    import { Icon } from '@smui/tab';
    import LeagueMatchup from './LeagueMatchup.svelte';

  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 

    export let selection = 'regular', displayPositionRecord = 'ALL', displayYear, waiversData, tradesData, weekRecords, weekLows, seasonLongRecords, leastSeasonLongPoints, showTies, winPercentages, fptsHistories, medianRecords, lineupIQs, prefix, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekMissedTOPS, playerWeekBests, playerWeekMissedBests, playerWeekTOPS, allManagers, displayObject, headToHeadRecords, leaguePlayerRecords, allTime=false;

    let leagueManagers = {};
    const numManagers = managers.length;

    const changeSelection = (s) => {
        selection = s;
        setHeading(selection);
    }

    let recordPrefix;
    const setHeading = (s) => {
        if(selection == 'regular') {
            recordPrefix = "Regular Season";
        } else if(selection == 'playoffs') {
            recordPrefix = "Playoffs";
        } else if(selection == 'combined') {
            recordPrefix = "Combined";
        }
    }

    $: setHeading(selection);

	for(const managerID in managers) {
		const manager = managers[managerID];
		leagueManagers[manager.managerID] = {
			managerID: manager.managerID,
			rosterID: manager.roster,
			name: manager.name,
			status: manager.status,
			yearsactive: manager.yearsactive,
		}
	}

    let lineupIQGraph = {
        stats: displayObject[selection].lineupIQs,
        x: "Manager",
        y: "Lineup IQ",
        stat: "%",
        statCat: 'lineupIQs',
        header: "Manager Lineup IQ",
        field: "iq",
        short: "Lineup IQ"
    }
    $: lineupIQGraph.stats = displayObject[selection].lineupIQs;

    let potentialPointsGraph = {
        stats: displayObject[selection].lineupIQs,
        secondStats: displayObject[selection].lineupIQs,
        x: "Manager",
        y: "Points",
        stat: "",
        statCat: 'lineupIQs',
        secondStatCat: 'lineupIQs',
        header: "Potential Points vs Points",
        field: "potentialPoints",
        secondField: "fpts",
        short: "Potential Points"
    }
    $: potentialPointsGraph.stats = displayObject[selection].lineupIQs;
    $: potentialPointsGraph.secondStats = displayObject[selection].lineupIQs;

    let winsGraph = {
        stats: displayObject[selection].winPercentages,
        x: "Manager",
        y: "Wins",
        stat: "",
        statCat: 'winPercentages',
        header: "Team Wins",
        field: "wins",
        short: "Wins"
    }
    $: winPercentagesGraph.stats = displayObject[selection].winPercentages;

    let winPercentagesGraph = {
        stats: displayObject[selection].winPercentages,
        x: "Manager",
        y: "Win Percentage",
        stat: "%",
        statCat: 'winPercentages',
        header: "Team Win Percentages",
        field: "winPerc",
        short: "Win Percentage"
    }
    $: winPercentagesGraph.stats = displayObject[selection].winPercentages;

    let fptsHistoriesGraph = {
        stats: displayObject[selection].fptsHistories,
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'fptsHistories',
        header: "Team Fantasy Points",
        field: "fptspg",
        short: "Fantasy Points"
    }
    $: fptsHistoriesGraph.stats = displayObject[selection].fptsHistories;

    let medianRecordsGraph = {
        stats: displayObject[selection].medianRecords,
        x: "Manager",
        y: "Win Percentage",
        stat: "%",
        statCat: 'medianRecords',
        header: "Managers Against the Median",
        field: "medianPerc",
        short: "Par Records"
    }
    $: medianRecordsGraph.stats = displayObject[selection].medianRecords;

    let fptsSeasonBestGraph = {
        stats: displayObject[selection].seasonBests, 
        secondStats: displayObject[selection].seasonWorsts,
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'seasonBests',
        secondStatCat: 'seasonWorsts',
        header: "Team Highest / Lowest Scoring Seasons",
        field: "fptspg",
	    secondField: "fptspg",
        short: "Season Records"
    }
    $: fptsSeasonBestGraph.stats = displayObject[selection].seasonBests;
    $: fptsSeasonBestGraph.secondStats = displayObject[selection].seasonWorsts;

    let fptsWeekBestGraph = {
        stats: displayObject[selection].weekBests,
        secondStats: displayObject[selection].weekWorsts, 
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'weekBests',
        secondStatCat: 'weekWorsts',
        header: "Team Highest / Lowest Scoring Weeks",
        field: "fpts",
        secondField: "fpts",
        short: "Weekly Records",
        yMinOverride: 0,
    }
    $: fptsWeekBestGraph.stats = displayObject[selection].weekBests;
    $: fptsWeekBestGraph.secondStats = displayObject[selection].weekWorsts;

    let epeWinPercGraph = {
        stats: displayObject[selection].seasonEPERecords,
        x: "Manager",
        y: "EPE Win Percentage",
        stat: "%",
        statCat: 'seasonEPERecords',
        header: "Everyone Plays Everyone Win Percentage",
        field: "epePerc",
        short: "EPE Records"
    }
    $: epeWinPercGraph.stats = displayObject[selection].seasonEPERecords;

    let playerSeasonBestGraph = {
        stats: displayObject[selection].playerSeasonBests,
        x: "Manager",
        y: "Fantasy Points Earned",
        stat: "",
        statCat: 'playerSeasonBests',
        header: "Top Single-Season Points Earners",
        field: "playerPPStart",
        short: "Season Leaders"
    }
    $: playerSeasonBestGraph.stats = displayObject[selection].playerSeasonBests;

    let playerWeekBestGraph = {
        stats: displayObject[selection].playerWeekBests,
        x: "Manager",
        y: "Fantasy Points Earned",
        stat: "",
        statCat: 'playerWeekBests',
        header: "Top Single-Week Points Earners",
        field: "playerPoints",
        short: "Week Leaders"
    }
    $: playerWeekBestGraph.stats = displayObject[selection].playerWeekBests;

    let playerWeekMissedBestGraph = {
        stats: displayObject[selection].playerWeekMissedBests,
        x: "Manager",
        y: "Fantasy Points Earned",
        stat: "",
        statCat: 'playerWeekMissedBests',
        header: "Top Benchwarmers",
        field: "benchPoints",
        short: "Benchwarmers"
    }
    $: playerWeekMissedBestGraph.stats = displayObject[selection].playerWeekMissedBests;

    for(let i = 1; i <= numManagers; i++) {
        if(waiversData.find(w => w.recordManID == i)) {
            const trade = waiversData.find(w => w.recordManID == i);
            if(!tradesData.find(t => t.recordManID == i)) {
                tradesData.push({
                    recordManID: i,
                    manager: trade.manager,
                    trades: 0,
                })
            }
        }
    }

    let tradesGraph = {
        stats: displayObject[selection].tradesData,
        x: "Manager",
        y: "# of trades",
        stat: "",
        statCat: 'tradesData',
        header: "Trades Managers Have Made",
        field: "trades",
        short: "Trades"
    }
    $: tradesGraph.stats = displayObject[selection].tradesData;

    let waiversGraph = {
        stats: displayObject[selection].waiversData,
        x: "Manager",
        y: "# of Waiver Moves",
        stat: "",
        statCat: 'waiversData',
        header: "Waivers Managers Have Made",
        field: "waivers",
        short: "Waivers"
    }
    $: waiversGraph.stats = displayObject[selection].waiversData;

    const graphs = [];

    if(lineupIQs[0]?.potentialPoints) {
        graphs.push(generateGraph(lineupIQGraph));
    }
    graphs.push(generateGraph(winsGraph, 5));
    graphs.push(generateGraph(winPercentagesGraph));
    graphs.push(generateGraph(fptsHistoriesGraph));
    graphs.push(generateGraph(medianRecordsGraph));
    if(lineupIQs[0]?.potentialPoints) {
        graphs.push(generateGraph(potentialPointsGraph, 10, 0));
    }
    graphs.push(generateGraph(tradesGraph));
    graphs.push(generateGraph(waiversGraph));
    graphs.push(generateGraph(fptsSeasonBestGraph));
    graphs.push(generateGraph(fptsWeekBestGraph));
    graphs.push(generateGraph(epeWinPercGraph));
    graphs.push(generateGraph(playerSeasonBestGraph));
    graphs.push(generateGraph(playerWeekBestGraph));
    graphs.push(generateGraph(playerWeekMissedBestGraph));

    const transactions = [];
    
    for(let i = 1; i <= numManagers; i++) {
        if(waiversData.find(w => w.recordManID == i)) {
            const waiver = waiversData.find(w => w.recordManID == i);
            const trades = tradesData.find(t => t.recordManID == i)?.trades || 0;
            const waivers = waiver?.waivers || 0;
            const manager = waiver.manager;
            transactions.push({
                recordManID: i,
                manager,
                trades,
                waivers,
            })
        }
    }
    
    let allManagerChoices = [];
    let allMatchups = [];
    let selectedMatchup;
    let managerChoicesLeft;
    let managerChoicesRight;

    let displayManagerLeft;
    let displayManagerRight;
 
    const getHead = (displayYear, selection) => {
        allManagerChoices = [];
        for(const manager in headToHeadRecords) {
            allManagerChoices.push({
                info: allManagers[manager],
                recordManID: manager,
            });
        }
        managerChoicesLeft = allManagerChoices;
        managerChoicesRight = allManagerChoices;
        displayManagerLeft = null;
        displayManagerRight = null;
        allMatchups = [];
        selectedMatchup = null;

        return allManagerChoices;
    }
    $: getHead(displayYear, selection);

    managerChoicesLeft = getHead(displayYear, selection);
    managerChoicesRight = getHead(displayYear, selection);

    let headToHeadShowTies = {
        regular: false,
        epe: false,
    }

    const changeManager = (newManagerLeft, newManagerRight, displayYear, selection) => {

        if(newManagerLeft != null) {
            managerChoicesRight = allManagerChoices.filter(m => m.recordManID != newManagerLeft);
            displayManagerLeft = {
                info: allManagers[newManagerLeft],
                recordManID: newManagerLeft,
                wins: 0,
                ties: 0,
                winPerc: 0,
                epeWins: 0,
                epeTies: 0,
                epePerc: 0,
                fpts: 0,
                fptspg: 0,
                matchups: [],
                specialMatchups: {
                    highScore: null,
                    lowScore: null,
                    bestBlowout: null,
                    worstBlowout: null,
                    bestNailbiter: null,
                    worstNailbiter: null,
                },
            }
            if(newManagerRight) {
                displayManagerLeft.wins = headToHeadRecords[newManagerLeft][newManagerRight].wins;
                displayManagerLeft.ties = headToHeadRecords[newManagerLeft][newManagerRight].ties;
                displayManagerLeft.fpts = headToHeadRecords[newManagerLeft][newManagerRight].fpts;
                displayManagerLeft.fptspg = headToHeadRecords[newManagerLeft][newManagerRight].fptspg;
                displayManagerLeft.epeWins = headToHeadRecords[newManagerLeft][newManagerRight].epeWins;
                displayManagerLeft.epeTies = headToHeadRecords[newManagerLeft][newManagerRight].epeTies;
                displayManagerLeft.winPerc = headToHeadRecords[newManagerLeft][newManagerRight].winPerc;
                displayManagerLeft.epePerc = headToHeadRecords[newManagerLeft][newManagerRight].epePerc;

                displayManagerLeft.matchups = headToHeadRecords[newManagerLeft][newManagerRight].matchups;

                displayManagerLeft.specialMatchups.highScore = headToHeadRecords[newManagerLeft][newManagerRight].highScore;
                displayManagerLeft.specialMatchups.lowScore = headToHeadRecords[newManagerLeft][newManagerRight].lowScore;
                displayManagerLeft.specialMatchups.bestBlowout = headToHeadRecords[newManagerLeft][newManagerRight].bestBlowout;
                displayManagerLeft.specialMatchups.worstBlowout = headToHeadRecords[newManagerLeft][newManagerRight].worstBlowout;
                displayManagerLeft.specialMatchups.bestNailbiter = headToHeadRecords[newManagerLeft][newManagerRight].bestNailbiter;
                displayManagerLeft.specialMatchups.worstNailbiter = headToHeadRecords[newManagerLeft][newManagerRight].worstNailbiter;

                if(displayManagerLeft.ties > 0) {
                    headToHeadShowTies.regular = true;
                }
                if(displayManagerLeft.epeTies > 0) {
                    headToHeadShowTies.epe = true;
                }

                selectedMatchup = 0;
            }

        } 
        if(newManagerRight != null) {
            managerChoicesLeft = allManagerChoices.filter(m => m.recordManID != newManagerRight);
            displayManagerRight = {
                info: allManagers[newManagerRight],
                recordManID: newManagerRight,
                wins: 0,
                ties: 0,
                winPerc: 0,
                epeWins: 0,
                epeTies: 0,
                epePerc: 0,
                fpts: 0,
                fptspg: 0,
                matchups: [],
                specialMatchups: {
                    highScore: null,
                    lowScore: null,
                    bestBlowout: null,
                    worstBlowout: null,
                    bestNailbiter: null,
                    worstNailbiter: null,
                },
            }
            if(newManagerLeft) {
                displayManagerRight.wins = headToHeadRecords[newManagerRight][newManagerLeft].wins;
                displayManagerRight.ties = headToHeadRecords[newManagerRight][newManagerLeft].ties;
                displayManagerRight.fpts = headToHeadRecords[newManagerRight][newManagerLeft].fpts;
                displayManagerRight.fptspg = headToHeadRecords[newManagerRight][newManagerLeft].fptspg;
                displayManagerRight.epeWins = headToHeadRecords[newManagerRight][newManagerLeft].epeWins;
                displayManagerRight.epeTies = headToHeadRecords[newManagerRight][newManagerLeft].epeTies;
                displayManagerRight.winPerc = headToHeadRecords[newManagerRight][newManagerLeft].winPerc;
                displayManagerRight.epePerc = headToHeadRecords[newManagerRight][newManagerLeft].epePerc;

                displayManagerRight.matchups = headToHeadRecords[newManagerRight][newManagerLeft].matchups;

                displayManagerRight.specialMatchups.highScore = headToHeadRecords[newManagerRight][newManagerLeft].highScore;
                displayManagerRight.specialMatchups.lowScore = headToHeadRecords[newManagerRight][newManagerLeft].lowScore;
                displayManagerRight.specialMatchups.bestBlowout = headToHeadRecords[newManagerRight][newManagerLeft].bestBlowout;
                displayManagerRight.specialMatchups.worstBlowout = headToHeadRecords[newManagerRight][newManagerLeft].worstBlowout;
                displayManagerRight.specialMatchups.bestNailbiter = headToHeadRecords[newManagerRight][newManagerLeft].bestNailbiter;
                displayManagerRight.specialMatchups.worstNailbiter = headToHeadRecords[newManagerRight][newManagerLeft].worstNailbiter;

                if(displayManagerRight.ties > 0) {
                    headToHeadShowTies.regular = true;
                }
                if(displayManagerRight.epeTies > 0) {
                    headToHeadShowTies.epe = true;
                }

                selectedMatchup = 0;
                
            }
        }
        allMatchups = [];
        if(newManagerLeft && newManagerRight) {
            for(const matchup in displayManagerLeft.matchups) {
                allMatchups.push({
                    home: displayManagerLeft.matchups[matchup].matchupInfo,
                    away: displayManagerRight.matchups[matchup].matchupInfo,
                })
            }
            displayMatchup = {
                home: displayManagerLeft.matchups[selectedMatchup],
                away: displayManagerRight.matchups[selectedMatchup],
            }
        }
    }

    let displayMatchup;
    const changeMatchup = (newMatchup) => {
        if(displayManagerLeft && displayManagerRight) {
            displayMatchup = {
                home: displayManagerLeft.matchups[newMatchup],
                away: displayManagerRight.matchups[newMatchup],
            }
            selectedMatchup = newMatchup;
        }
    }
    $: changeMatchup(selectedMatchup);


    let curTable = 0;
    let curTableDesc;
    let curGraph = 0;

    let iqOffset = 0;
    const tables = [
        "Win Percentages",
        "Points",
        "Par Records",
        "Transactions",
        "Season Highs",
        "Season Lows",
        "Week Highs",
        "Week Lows",
        "EPE Records",
        "Season Leaders",
        "Week Leaders",
        "Benchwarmers",
    ]

    if(!lineupIQs[0]?.potentialPoints) {
        iqOffset = 1;
        curTableDesc = 'winPercentages.wins';
    } else {
        tables.unshift('Lineup IQs');
        curTableDesc = 'lineupIQs.iq';
    }
    const changeTable = (newGraph) => {
        switch (newGraph) {
            case 0 - iqOffset:
            case (5 + (99 * iqOffset)):
                curTable = 0;
                break;
            case 1 - iqOffset:
            case 2 - iqOffset:
                curTable = 1 - iqOffset;
                break;
            case 3 - iqOffset:
                curTable = 2 - iqOffset;
                break;
            case 4 - iqOffset:
                curTable = 3 - iqOffset;
                break;
            case 6 - (2 * iqOffset):
            case 7 - (2 * iqOffset):
                curTable = 4 - iqOffset;
                break;
	         case 8 - (2 * iqOffset):
		        if(curTable == 5 - iqOffset || curTable == 6 - iqOffset) {
		            break;
		        }
		        curTable = 5 - iqOffset;
		        break;			
            case 9 - (2 * iqOffset):
		        if(curTable == 7 - iqOffset || curTable == 8 - iqOffset) {
		            break;
		        }
                curTable = 7 - iqOffset;
                break;
            case 10 - (2 * iqOffset):
                curTable = 9 - iqOffset;
                break;
            case 11 - (2 * iqOffset):
                curTable = 10 - iqOffset;
                break;
            case 12 - (2 * iqOffset):
                curTable = 11 - iqOffset;
                break;
            case 13 - (2 * iqOffset):
                curTable = 12 - iqOffset;
                break;
            default:
                curTable = 0;
                break;
        }
    }

    const changeGraph = (newTable) => {
        switch (newTable) {
            case 0 - iqOffset:
                if(curGraph == 0 || curGraph == 5) {
                    break;
                }
                curGraph = 0;
                curTableDesc = 'lineupIQs.iq';
                break;
            case 1 - iqOffset:
                if(curGraph == 1 - iqOffset || curGraph == 2 - iqOffset) {
                    break;
                }
                curTableDesc = 'winPercentages.wins';
                curGraph = 1 - iqOffset;
                break;
            case 2 - iqOffset:
                curTableDesc = 'fptsHistories.fptspg';
                curGraph = 3 - iqOffset;
                break;
            case 3 - iqOffset:
                curTableDesc = 'medianRecords.medianPerc';
                curGraph = 4 - iqOffset;
                break;
            case 4 - iqOffset:
                if(curGraph == 6 - (2 * iqOffset) || curGraph == 7 - (2 * iqOffset)) {
                    break;
                }
                curTableDesc = 'tradesData.trades';
                curGraph = 6 - (2 * iqOffset);
                break;
            case 5 - iqOffset:
                curTableDesc = 'seasonBests.fptspg';
                curGraph = 8 - (2 * iqOffset);
                break;
            case 6 - iqOffset:
                curTableDesc = 'seasonWorsts.fptspg';
                curGraph = 8 - (2 * iqOffset);
                break;
            case 7 - iqOffset:
                curTableDesc = 'weekBests.fpts';
                curGraph = 9 - (2 * iqOffset);
                break;
            case 8 - iqOffset:
                curTableDesc = 'weekWorsts.fpts';
                curGraph = 9 - (2 * iqOffset);
                break;
	        case 9 - iqOffset:
                curTableDesc = 'sseasonEPERecords.epePerc';
                curGraph = 10 - (2 * iqOffset);
                break;
	        case 10 - iqOffset:
                curTableDesc = 'playerSeasonBests.playerPPStart';
                curGraph = 11 - (2 * iqOffset);
                break;
            case 11 - iqOffset:
                curTableDesc = 'playerWeekBests.playerPoints';
                curGraph = 12 - (2 * iqOffset);
                break;
            case 12 - iqOffset:
                curTableDesc = 'playerWeekMissedBests.benchPoints';
                curGraph = 13 - (2 * iqOffset);
                break;
            default:
                curTableDesc = 'lineupIQs.iq';
                curGraph = 0;
                break;
        }
    }

    $: changeTable(curGraph);
    $: changeGraph(curTable);

    let displayWeekRecord = 'high';
    const changeWeekRecord = (weekType) => {
        if(weekType == 'high') {
            displayWeekRecord = 'high';
        } else if(weekType == 'low') {
            displayWeekRecord = 'low';
        }
    }
    $: changeWeekRecord(displayWeekRecord);

    let displaySeasonRecord = 'high';
    const changeSeasonRecord = (seasonType) => {
        if(seasonType == 'high') {
            displaySeasonRecord = 'high';
        } else if(seasonType == 'low') {
            displaySeasonRecord = 'low';
        }
    }
    $: changeSeasonRecord(displaySeasonRecord);

    let displayMarginRecord = 'blowout';
    let marginRecordHeading = 'Blowouts';
    const changeMarginRecord = (marginType) => {
        if(marginType == 'blowout') {
            displayMarginRecord = 'blowout';
            marginRecordHeading = 'Blowouts';
        } else if(marginType == 'narrow') {
            displayMarginRecord = 'narrow';
            marginRecordHeading = 'Nailbiters';
        }
    }
    $: changeMarginRecord(displayMarginRecord);

    let displayPlayerRecord = 'week';
    const changePlayerRecord = (playerType) => {
        if(playerType == 'week') {
            displayPlayerRecord = 'week';
        } else if(playerType == 'season') {
            displayPlayerRecord = 'season';
        } else if(playerType == 'bench') {
            displayPlayerRecord = 'bench';
        } 
    }
    $: changePlayerRecord(displayPlayerRecord);

    let positionsArray = [];
    const getPositions = (displayYear) => {
        positionsArray = [];
        for(const position in leaguePlayerRecords) {
            if(position != 'managerBests' && !positionsArray.includes(position) && leaguePlayerRecords[position].week_Top.length > 0) {
                positionsArray.push(position);
            }
        }
    }
    $: getPositions(displayYear);
    
    

    const changePositionRecord = (positionType) => {
        displayPositionRecord = positionType;
    }
    $: changePositionRecord(displayPositionRecord);
    
    
    let innerWidth;

</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    :global(.header) {
        text-align: center;
    }

    /* recordTable styling */

    :global(.recordTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em;
        background-color: var(--gcComponent);
    }

    :global(.recordTable th) {
        background-color: var(--gcMain);
        text-align: center;
        color: var(--gcBannerText);
    }

    :global(.recordTable td) {
        background-color: var(--gcSelect);
        color: var(--gcPlayRowText);
        font-weight: 400;
    }

    :global(.recordTable thead tr) {
        background-color: var(--gcMain);
    }

    :global(.recordTable tbody tr) {
        background-color: var(--gcSelect);
    }

    :global(.recordTable table) {
        background-color: var(--gcBox);
    }

    /* rankingTable styling */

    :global(.rankingTable) {
        display: table;
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em auto 0.5em;
        background-color: var(--gcComponent);
    }

    :global(.rankingTable th) {
        background-color: var(--gcMain);
        text-align: center;
        color: var(--gcBannerText);
    }

    :global(.rankingTable td) {
        background-color: var(--gcSelect);
        color: var(--gcPlayRowText);
        font-weight: 400;
    }

    :global(.rankingTable thead tr) {
        background-color: var(--gcMain);
    }

    :global(.rankingTable tbody tr) {
        background-color: var(--gcSelect);
    }

    :global(.rankingTable table) {
        background-color: var(--gcBox);
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
        padding: 0 0 0 20px;
    }
    
    .rankingHolder {
        display: block;
        width: 100%;
        overflow-x: hidden;
    }

    .subTitle {
        font-style: italic;
        font-size: 0.7em;
        color: #888;
        line-height: 1.2em;
    }

    .fantasyTeamName {
        font-style: italic;
        color: #999;
        font-size: 0.8em;
        line-height: 1.1em;
    }

    .rankingTableWrapper {
        width: 25%;
    }

    .rankingInner {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        width: 1300%;
		transition: margin-left 0.8s;
    }

    .buttonHolder {
        text-align: center;
        margin: 2em 0;
        width: 100%;
        display: inline-flex;
        position: relative;
        align-items: center;
        justify-content: center;
        line-height: 1.15em;
        flex-wrap: wrap;
    }

    :global(.cellName) {
        cursor: pointer;
        line-height: 1.2em;
    }

    :global(.differentialName) {
        padding: 0.7em 0;
    }

    .center {
        text-align: center;
    }

    .left {
        text-align: left;
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

    /* Start ranking table resizing */

    @media (max-width: 570px) {
        :global(.rankingTable th) {
            font-size: 0.8em;
            max-width: 110px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
        :global(.rankingTable td) {
            font-size: 0.8em;
            max-width: 110px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
    }

    @media (max-width: 410px) {
        :global(.rankingTable th) {
            font-size: 0.6em;
            max-width: 90px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
        :global(.rankingTable td) {
            font-size: 0.6em;
            max-width: 90px;
            white-space: break-spaces;
            padding: 1px 12px;
        }
    }

    @media (max-width: 340px) {
        :global(.rankingTable th) {
            font-size: 0.55em;
            max-width: 80px;
            white-space: break-spaces;
            padding: 1px 6px;
        }
        :global(.rankingTable td) {
            font-size: 0.55em;
            max-width: 80px;
            white-space: break-spaces;
            padding: 1px 6px;
        }
    }

    /* END ranking table resizing */


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

    .headToHeadWrap {
        position: relative;
        display: inline-flex;
        flex-direction: row;
        justify-content: center;
        width: 79.5%;
        height: 50em;
        background-color: var(--gcBox);
        padding: 0.25%;
    }

    .headToHeadChoices {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 19.5%;
        margin: 0.25%;
        background-color: var(--gcComponent);
        justify-content: space-evenly;
    }

    .headToHeadMain {
        position: relative;
        display: inline-flex;
        width: 100%;
        height: 20%;
        background-color: var(--gcComponent);
    }

    .headToHeadRow {
        position: relative;
        display: inline-flex;
        color: var(--gcPlayRowText);
        width: 92%;
        padding: 0 4%;
        height: 2.5em;
        align-items: center;
    }

    .headToHeadRow:hover {
        cursor: pointer;
        background-color: var(--gcSelect);
        border: 0.1em solid var(--g111);
        height: 2.3em;
        width: 90%;
    }

    .managerAvatar {
        display: inline-flex;
        flex-direction: row;
        position: relative;
        border: 0.25px solid #777; 
        border-radius: 50%; 
        height: 90%; 
        width: auto;
        margin: 0 2%;
    }

    .managerName {
        display: inline-flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
    }

    .managerProfile {
        display: inline-flex;
        position: relative;
        height: 40%;
        width: 100%;
        align-items: center;
        justify-content: center;
    }

    .headToHeadSummaryWrap {
        display: inline-flex;
        position: relative;
        height: 60%;
        width: 100%;
    }

    .headToHeadSummaryText {
        display: inline-flex;
        position: relative;
        width: 100%;
    }

    .matchupHolder {
        display: inline-flex;
        position: relative;
        background-color: var(--gcComponent);
        width: 100%;
        height: 100%;
        flex-wrap: nowrap;
		transition: margin-left 0.8s;
    }

    .matchupWrap {
        display: block;
        width: 100%;
        height: 73%;
        overflow-x: hidden;
    }

    .matchupSwitcher {
        display: inline-flex;
        position: relative;
        background-color: var(--gcComponent);
        width: 100%;
        height: 5%;
        padding: 1% 0;
        border-top: 0.1em dashed var(--gcBox);
        align-items: center;
        justify-content: space-between;
        color: var(--gcPlayRowText);
        font-size: 1.4em;
    }

    .headingText {
        display: inline-flex;
        position: relative;
        font-size: 1em;
        font-weight: 450;
        width: 50%;
        color: var(--gcPlayRowText);
        justify-content: center;
    }

    :global(.changeMatchup) {
        display: inline-flex;
        position: relative;
        justify-content: center;
        font-size: 2.5em;
        cursor: pointer;
        color: #888;
        width: 25%;
    }

    :global(.changeMatchup:hover) {
        color: #00316b;
    }

    .spacer {
        width: 25%;
    }

    .matchup {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        border-radius: 1em;
        background-color: var(--gcComponent);
        align-self: center;
        /* box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 30%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 4px 3px var(--gcScoreShadow); */
    }

</style>

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
    {#if allTime}
        <div class="headerLabel">Weeks</div>
        <div class="headerLabel">Seasons</div>
    {:else}
        <div class="headerLabel" style="justify-content: center">Weeks</div>
    {/if}
</div>

<div class="recordsWrap">
    <div class="columnWrap" style="{!allTime ? "width: 98%;" : null}">
        <div class="buttonHolder">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changeWeekRecord('high')} variant="{displayWeekRecord == 'high' ? "raised" : "outlined"}">
                    <Label>Highest</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeWeekRecord('low')} variant="{displayWeekRecord == 'low' ? "raised" : "outlined"}">
                    <Label>Lowest</Label>
                </Button>
            </Group>
        </div>
        {#if displayWeekRecord == 'high'}
            {#if weekRecords && weekRecords.length}
                <DataTable class="recordTable" style="width: 450px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Top 10 Week Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each weekRecords as leagueWeekRecord, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(leagueWeekRecord.recordManID)}>
                                    {leagueWeekRecord.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({leagueWeekRecord.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}
                                        <Cell class="center">{leagueWeekRecord.year}</Cell>
                                    {/if}
                                <Cell class="center">{leagueWeekRecord.week}</Cell>
                                <Cell class="center">{round(leagueWeekRecord.fpts)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {:else if displayWeekRecord == 'low'}
            {#if weekRecords && weekRecords.length}
                <DataTable class="recordTable" style="width: 450px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Top 10 Lowest Week Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each weekLows as leagueWeekLow, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(leagueWeekLow.recordManID)}>
                                    {leagueWeekLow.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({leagueWeekLow.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}
                                        <Cell class="center">{leagueWeekLow.year}</Cell>
                                    {/if}
                                <Cell class="center">{leagueWeekLow.week}</Cell>
                                <Cell class="center">{round(leagueWeekLow.fpts)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {/if}
    </div>
    {#if allTime}
        <div class="columnWrap">
            <div class="buttonHolder">
                <Group variant="outlined">
                    <Button class="selectionButtons" on:click={() => changeSeasonRecord('high')} variant="{displaySeasonRecord == 'high' ? "raised" : "outlined"}">
                        <Label>Highest</Label>
                    </Button>
                    <Button class="selectionButtons" on:click={() => changeSeasonRecord('low')} variant="{displaySeasonRecord == 'low' ? "raised" : "outlined"}">
                        <Label>Lowest</Label>
                    </Button>
                </Group>
            </div>
            {#if displaySeasonRecord == 'high'}
                <DataTable class="recordTable" style="width: 450px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Top 10 Season-Long Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">Year</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header">PPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonLongRecords as mostSeasonLongPoint, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(mostSeasonLongPoint.recordManID)}>
                                    {mostSeasonLongPoint.manager.realname}
                                    {#if !allTime}
                                    <div class="fantasyTeamName">({mostSeasonLongPoint.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center">{mostSeasonLongPoint.year}</Cell>
                                <Cell class="center">{round(mostSeasonLongPoint.fpts)}</Cell>
                                <Cell class="center">{round(mostSeasonLongPoint.fptspg)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {:else if displaySeasonRecord == 'low'}
                <DataTable class="recordTable" style="width: 450px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Top 10 Lowest Season-Long Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">Year</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header">PPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each leastSeasonLongPoints as leastSeasonLongPoint, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(leastSeasonLongPoint.recordManID)}>
                                    {leastSeasonLongPoint.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({leastSeasonLongPoint.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center">{leastSeasonLongPoint.year}</Cell>
                                <Cell class="center">{round(leastSeasonLongPoint.fpts)}</Cell>
                                <Cell class="center">{round(leastSeasonLongPoint.fptspg)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>
    {/if}
</div>

<div class="headerRow">
        <div class="headerLabel" style="justify-content: center">{marginRecordHeading}</div>
</div>

<div class="recordsWrap">
    <div class="columnWrap" style="width: 98%;">
        <div class="buttonHolder">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changeMarginRecord('blowout')} variant="{displayMarginRecord == 'blowout' ? "raised" : "outlined"}">
                    <Label>Blowouts</Label>
                </Button>
                <Button class="selectionButtons" on:click={() => changeMarginRecord('narrow')} variant="{displayMarginRecord == 'narrow' ? "raised" : "outlined"}">
                    <Label>Nailbiters</Label>
                </Button>
            </Group>
        </div>
        {#if displayMarginRecord == 'blowout'}
            {#if blowouts && blowouts.length}
                <DataTable class="recordTable" style="width: 900px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Top 10 Biggest Blowouts<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Winner</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Loser</Cell>
                            <Cell class="header">PF</Cell>
                            {#if allTime}
                                <Cell class="header">Year</Cell>
                            {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">Diff</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each blowouts as blowout, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" style="background-color: #229bd924;" on:click={() => gotoManager(blowout.recordManID)}>
                                    {blowout.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({blowout.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center" style="background-color: #0182c326;">{round(blowout.fpts)}</Cell>
                                <Cell class="center">vs</Cell>
                                <Cell class="cellName" style="background-color: #7a7a7a33;" on:click={() => gotoManager(blowout.againstRecordManID)}>
                                    {blowout.againstManager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({blowout.againstManager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center" style="background-color: #6a6a6a33;">{round(blowout.fptsAgainst)}</Cell>
                                {#if allTime}
                                    <Cell class="center">{blowout.year}</Cell>
                                {/if}
                                <Cell class="center">{blowout.week}</Cell>
                                <Cell class="center">{round(blowout.matchDifferential)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {:else if displayMarginRecord == 'narrow'}
            {#if closestMatchups && closestMatchups.length}
                <DataTable class="recordTable" style="width: 900px;">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Top 10 Narrowest Victories<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Winner</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header rank"></Cell>
                            <Cell class="header">Loser</Cell>
                            <Cell class="header">PF</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">Diff</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each closestMatchups as closestMatchup, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="cellName" style="background-color: #229bd924;" on:click={() => gotoManager(closestMatchup.recordManID)}>
                                    {closestMatchup.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({closestMatchup.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center" style="background-color: #0182c326;">{round(closestMatchup.fpts)}</Cell>
                                <Cell class="center">vs</Cell>
                                <Cell class="cellName" style="background-color: #7a7a7a33;" on:click={() => gotoManager(closestMatchup.againstRecordManID)}>
                                    {closestMatchup.againstManager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({closestMatchup.againstManager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center" style="background-color: #6a6a6a33;">{round(closestMatchup.fptsAgainst)}</Cell>
                                    {#if allTime}
                                        <Cell class="center">{closestMatchup.year}</Cell>
                                    {/if}
                                <Cell class="center">{closestMatchup.week}</Cell>
                                <Cell class="center">{round(closestMatchup.matchDifferential)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
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
            </Group>
        </div>
        <div class="buttonHolder" style="margin: 0.5em 0;">
            <Group variant="outlined">
                <Button class="selectionButtons" on:click={() => changePositionRecord('ALL')} variant="{displayPositionRecord == 'ALL' ? "raised" : "outlined"}">
                    <Label>ALL</Label>
                </Button>
                {#each positionsArray as position}
                    <Button class="selectionButtons" on:click={() => changePositionRecord(position)} variant="{displayPositionRecord == position ? "raised" : "outlined"}">
                        <Label>{position}</Label>
                    </Button>
                {/each}
            </Group>
        </div>
        {#if displayPlayerRecord == 'week'}
            {#if playerWeekTOPS && playerWeekTOPS.length}
                <DataTable class="recordTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Top 10 Week Scores - {displayPositionRecord == 'ALL' ? 'Players' : displayPositionRecord}<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" />
                            <Cell class="header">Player</Cell>
                            {#if displayPositionRecord == 'ALL'}
                                <Cell class="header">POS</Cell>
                            {/if}
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                            {#if allTime}
                                <Cell class="header">Year</Cell>
                            {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerWeekTOPS as playerATWeekTOP, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATWeekTOP.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATWeekTOP.playerInfo.fn} {playerATWeekTOP.playerInfo.ln}</Cell>
                                {#if displayPositionRecord == 'ALL'}
                                    <Cell class="center">{playerATWeekTOP.playerInfo.pos}</Cell>
                                {/if}
                                <Cell class="center">{playerATWeekTOP.playerInfo.pos == 'DEF' ? playerATWeekTOP.playerID : playerATWeekTOP.nflInfo.espn.t[playerATWeekTOP.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATWeekTOP.nflInfo.espn.t[playerATWeekTOP.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATWeekTOP.nflInfo.espn.t[playerATWeekTOP.year].find(w => w.firstWeek <= playerATWeekTOP.week && w.lastWeek >= playerATWeekTOP.week).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATWeekTOP.recordManID)}>
                                    {playerATWeekTOP.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATWeekTOP.manager.name})</div>
                                    {/if}
                                </Cell>
                                {#if allTime}
                                    <Cell class="center">{playerATWeekTOP.year}</Cell>
                                {/if}
                                <Cell class="center">{playerATWeekTOP.week}</Cell>
                                <Cell class="center">{round(playerATWeekTOP.playerPoints)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {:else if displayPlayerRecord == 'season'}
            {#if playerSeasonTOPS && playerSeasonTOPS.length}
                <DataTable class="recordTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=12>
                                <p>
                                    Top 10 Season-Long Scores – {displayPositionRecord == 'ALL' ? 'Players' : displayPositionRecord}<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" />
                            <Cell class="header">Player</Cell>
                            {#if displayPositionRecord == 'ALL'}
                                <Cell class="header">POS</Cell>
                            {/if}
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                            {#if allTime}
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
                        {#each playerSeasonTOPS as playerATSeasonTOP, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATSeasonTOP.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATSeasonTOP.playerInfo.fn} {playerATSeasonTOP.playerInfo.ln}</Cell>
                                {#if displayPositionRecord == 'ALL'}
                                    <Cell class="center">{playerATSeasonTOP.playerInfo.pos}</Cell>
                                {/if}
                                <Cell class="center">{playerATSeasonTOP.playerInfo.pos == 'DEF' ? playerATSeasonTOP.playerID : playerATSeasonTOP.nflInfo.espn.t[playerATSeasonTOP.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATSeasonTOP.nflInfo.espn.t[playerATSeasonTOP.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATSeasonTOP.nflInfo.espn.t[playerATSeasonTOP.year].find(w => w.lastWeek == 100).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATSeasonTOP.recordManID)}>
                                    {playerATSeasonTOP.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATSeasonTOP.manager.name})</div>
                                    {/if}
                                </Cell>
                                {#if allTime}
                                    <Cell class="center">{playerATSeasonTOP.year}</Cell>
                                {/if}
                                <Cell class="center">{playerATSeasonTOP.topStarters}</Cell>
                                <Cell class="center">{round(playerATSeasonTOP.starterRankAVG)}</Cell>
                                <Cell class="center">{playerATSeasonTOP.weeksStarted} / {playerATSeasonTOP.weeksOwned}</Cell>
                                <Cell class="center">{round(playerATSeasonTOP.playerPoints)}</Cell>
                                <Cell class="center">{round(playerATSeasonTOP.playerPPStart)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {:else if displayPlayerRecord == 'bench'}
            {#if playerWeekMissedTOPS && playerWeekMissedTOPS.length}
                <DataTable class="recordTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Top 10 Benchwarmers – {displayPositionRecord == 'ALL' ? 'Players' : displayPositionRecord}<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>                  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" /> 
                            <Cell class="header">Player</Cell>
                            {#if displayPositionRecord == 'ALL'}
                                <Cell class="header">POS</Cell>
                            {/if}
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                            {#if allTime}
                                <Cell class="header">Year</Cell>
                            {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerWeekMissedTOPS as playerATWeekMissedTOP, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATWeekMissedTOP.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATWeekMissedTOP.playerInfo.fn} {playerATWeekMissedTOP.playerInfo.ln}</Cell>
                                {#if displayPositionRecord == 'ALL'}
                                    <Cell class="center">{playerATWeekMissedTOP.playerInfo.pos}</Cell>
                                {/if}
                                <Cell class="center">{playerATWeekMissedTOP.playerInfo.pos == 'DEF' ? playerATWeekMissedTOP.playerID : playerATWeekMissedTOP.nflInfo.espn.t[playerATWeekMissedTOP.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATWeekMissedTOP.nflInfo.espn.t[playerATWeekMissedTOP.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATWeekMissedTOP.nflInfo.espn.t[playerATWeekMissedTOP.year].find(w => w.firstWeek <= playerATWeekMissedTOP.week && w.lastWeek >= playerATWeekMissedTOP.week).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATWeekMissedTOP.recordManID)}>
                                    {playerATWeekMissedTOP.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATWeekMissedTOP.manager.name})</div>
                                    {/if}
                                </Cell>
                                {#if allTime}
                                    <Cell class="center">{playerATWeekMissedTOP.year}</Cell>
                                {/if}
                                <Cell class="center">{playerATWeekMissedTOP.week}</Cell>
                                <Cell class="center">{round(playerATWeekMissedTOP.benchPoints)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        {/if}
    </div>
</div>

<div class="headerRow">
    <div class="headerLabel" style="justify-content: center">{prefix} Rankings</div>
</div>


<BarChart maxWidth={innerWidth} {graphs} {displayObject} {leagueManagers} {allManagers} bind:displayYear={displayYear} bind:selection={selection} bind:allTime={allTime} bind:curGraph={curGraph} bind:curTableDesc={curTableDesc} />

<div class="rankingHolder">
    <div class="rankingInner" style="margin-left: -{100 * curTable}%;">
        {#if lineupIQs[0]?.potentialPoints}
            <div class="rankingTableWrapper">
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                {prefix} Lineup IQ Rankings
                                <div class="subTitle">
                                    The percentage of potential points each manager has captured
                                </div>
                            </Cell>
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">IQ</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header">Poss. PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each lineupIQs as lineupIQ, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(lineupIQ.recordManID)}>
                                    {lineupIQ.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({lineupIQ.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center">{lineupIQ.iq}%</Cell>
                                <Cell class="center">{lineupIQ.fpts}</Cell>
                                <Cell class="center">{lineupIQ.potentialPoints}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            </div>
        {/if}

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=6>
                            <p>
                                Win Percentage Rankings<br>
                                {prefix} – {recordPrefix} 
                            </p>
                        </Cell>                      
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Win %</Cell>
                        <Cell class="header">W</Cell>
                            {#if showTies}
                                <Cell class="header">T</Cell>
                            {/if}
                        <Cell class="header">L</Cell>	   
                    </Row>
                </Head>
                <Body>
                    {#each winPercentages as winPercentage, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" on:click={() => gotoManager(winPercentage.recordManID)}>
                                {winPercentage.manager.realname}
                                {#if !allTime}
                                    <div class="fantasyTeamName">({winPercentage.manager.name})</div>
                                {/if}
                            </Cell>
                            <Cell class="center">{round(winPercentage.winPerc)}%</Cell>
                            <Cell class="center">{winPercentage.wins}</Cell>
                                {#if showTies}
                                    <Cell class="center">{winPercentage.ties}</Cell>
                                {/if}
                            <Cell class="center">{winPercentage.losses}</Cell>			
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=5>
                            <p>
                                Points Per Game Rankings<br>
                                {prefix} – {recordPrefix} 
                            </p>
                        </Cell>   
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">PF</Cell>
                        <Cell class="header">PA</Cell>
			            <Cell class="header">PPG</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each fptsHistories as fptsHistory, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" on:click={() => gotoManager(fptsHistory.recordManID)}>
                                {fptsHistory.manager.realname}
                                {#if !allTime}
                                    <div class="fantasyTeamName">({fptsHistory.manager.name})</div>
                                {/if}
                            </Cell>
                            <Cell class="center">{round(fptsHistory.fpts)}</Cell>
                            <Cell class="center">{round(fptsHistory.fptsAgainst)}</Cell>
			                <Cell class="center">{round(fptsHistory.fptspg)}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=8>
                            <p>
                                Managers Against the Median Rankings<br>
                                {prefix} – {recordPrefix} 
                            </p>
                        </Cell>   
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Median Win %</Cell>
                        <Cell class="header">W</Cell>
                        <!-- {#if showTies} -->
                            <Cell class="header">T</Cell>
                        <!-- {/if} -->
                        <Cell class="header">L</Cell>
                        <Cell class="header">Avg. Week Rank</Cell>
                        <Cell class="header">Avg. End Rank</Cell>	
                    </Row>
                </Head>
                <Body>
                    {#each medianRecords as medianRecord, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" on:click={() => gotoManager(medianRecord.recordManID)}>
                                {medianRecord.manager.realname}
                                {#if !allTime}
                                    <div class="fantasyTeamName">({medianRecord.manager.name})</div>
                                {/if}
                            </Cell>			
                            <Cell class="center">{round(medianRecord.medianPerc)}%</Cell>
                            <Cell class="center">{medianRecord.weekWinners}</Cell>
                            <!-- {#if showTies} -->
                                <Cell class="center">{medianRecord.weekTies}</Cell>
                            <!-- {/if} -->
                            <Cell class="center">{medianRecord.weekLosers}</Cell>
                            <Cell class="center">{medianRecord.weekLosers}</Cell>
                            <Cell class="center">{medianRecord.weekLosers}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=4>
                            {prefix} Transaction Totals
                        </Cell>
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">Trades</Cell>
                        <Cell class="header">Waivers</Cell>
                    </Row>
                </Head>
                <Body>
                    {#each transactions as transaction, ix}
                        <Row>
                            <Cell>{ix + 1}</Cell>
                            <Cell class="cellName" on:click={() => gotoManager(transaction.recordManID)}>
                                {transaction.manager.realname}
                                {#if !allTime}
                                    <div class="fantasyTeamName">({transaction.manager.name})</div>
                                {/if}
                            </Cell>
                            <Cell class="center">{transaction.trades}</Cell>
                            <Cell class="center">{transaction.waivers}</Cell>
                        </Row>
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            {#if seasonBests && seasonBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Personal Best Season-Long Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">PF</Cell>
                            <Cell class="header">PPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonBests as allTimeSeasonBest, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(allTimeSeasonBest.recordManID)}>
                                    {allTimeSeasonBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({allTimeSeasonBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}				
                                        <Cell class="center">{allTimeSeasonBest.year}</Cell>
                                    {/if}
                                <Cell class="center">{round(allTimeSeasonBest.fpts)}</Cell>
                                <Cell class="center">{round(allTimeSeasonBest.fptspg)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if seasonWorsts && seasonWorsts.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Personal Worst Season-Long Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">Year</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header">PPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonWorsts as allTimeSeasonWorst, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(allTimeSeasonWorst.recordManID)}>
                                    {allTimeSeasonWorst.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({allTimeSeasonWorst.manager.name})</div>
                                    {/if}
                                </Cell>
                                <Cell class="center">{allTimeSeasonWorst.year}</Cell>
                                <Cell class="center">{round(allTimeSeasonWorst.fpts)}</Cell>
                                <Cell class="center">{round(allTimeSeasonWorst.fptspg)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if weekBests && weekBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Personal Best Week Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each weekBests as allTimeWeekBest, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(allTimeWeekBest.recordManID)}>
                                    {allTimeWeekBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({allTimeWeekBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}				
                                        <Cell class="center">{allTimeWeekBest.year}</Cell>
                                    {/if}
                                <Cell class="center">{allTimeWeekBest.week}</Cell>
                                <Cell class="center">{round(allTimeWeekBest.fpts)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>
	    
        <div class="rankingTableWrapper">
            {#if weekWorsts && weekWorsts.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=5>
                                <p>
                                    Personal Worst Week Scores<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each weekWorsts as allTimeWeekWorst, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(allTimeWeekWorst.recordManID)}>
                                    {allTimeWeekWorst.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({allTimeWeekWorst.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}				
                                        <Cell class="center">{allTimeWeekWorst.year}</Cell>
                                    {/if}
                                <Cell class="center">{allTimeWeekWorst.week}</Cell>
                                <Cell class="center">{round(allTimeWeekWorst.fpts)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if seasonEPERecords && seasonEPERecords.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=8>
                                <p>
                                    Everyone Plays Everyone Records<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header"></Cell>
                            <Cell class="header">Manager</Cell>
                            <Cell class="header">EPE Win %</Cell>
                            <Cell class="header">W</Cell>
                            <!-- {#if showTies} -->
                                <Cell class="header">T</Cell>
                            <!-- {/if} -->
                            <Cell class="header">L</Cell>
                            <Cell class="header">Top Score</Cell>
                            <Cell class="header">Bot. Score</Cell>	
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonEPERecords as allTimeEPERecord, ix}
                            <Row>
                                <Cell>{ix + 1}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(allTimeEPERecord.recordManID)}>
                                    {allTimeEPERecord.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({allTimeEPERecord.manager.name})</div>
                                    {/if}
                                </Cell>			
                                <Cell class="center">{round(allTimeEPERecord.epePerc)}%</Cell>
                                <Cell class="center">{allTimeEPERecord.epeWins}</Cell>
                                <!-- {#if showTies} -->
                                    <Cell class="center">{allTimeEPERecord.epeTies}</Cell>
                                <!-- {/if} -->
                                <Cell class="center">{allTimeEPERecord.epeLosses}</Cell>
                                <Cell class="center">{allTimeEPERecord.topScores}</Cell>
                                <Cell class="center">{allTimeEPERecord.bottomScores}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if playerSeasonBests && playerSeasonBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=12>
                                <p>
                                    Personal Best Season-Long Scores – Players<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" />
                            <Cell class="header">Player</Cell>
                            <Cell class="header">POS</Cell>
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
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
                        {#each playerSeasonBests as playerATSeasonBest, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATSeasonBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATSeasonBest.playerInfo.fn} {playerATSeasonBest.playerInfo.ln}</Cell>
                                <Cell class="center">{playerATSeasonBest.playerInfo.pos}</Cell>
                                <Cell class="center">{playerATSeasonBest.playerInfo.pos == 'DEF' ? playerATSeasonBest.playerID : playerATSeasonBest.nflInfo.espn.t[playerATSeasonBest.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATSeasonBest.nflInfo.espn.t[playerATSeasonBest.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATSeasonBest.nflInfo.espn.t[playerATSeasonBest.year].find(w => w.lastWeek == 100).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATSeasonBest.recordManID)}>
                                    {playerATSeasonBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATSeasonBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}
                                        <Cell class="center">{playerATSeasonBest.year}</Cell>
                                    {/if}
                                <Cell class="center">{playerATSeasonBest.topStarters}</Cell>
                                <Cell class="center">{round(playerATSeasonBest.starterRankAVG)}</Cell>
                                <Cell class="center">{playerATSeasonBest.weeksStarted} / {playerATSeasonBest.weeksOwned}</Cell>
                                <Cell class="center">{round(playerATSeasonBest.playerPoints)}</Cell>
                                <Cell class="center">{round(playerATSeasonBest.playerPPStart)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if playerWeekBests && playerWeekBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Personal Best Week Scores – Players<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" />
                            <Cell class="header">Player</Cell>
                            <Cell class="header">POS</Cell>
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerWeekBests as playerATWeekBest, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATWeekBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATWeekBest.playerInfo.fn} {playerATWeekBest.playerInfo.ln}</Cell>
                                <Cell class="center">{playerATWeekBest.playerInfo.pos}</Cell>
                                <Cell class="center">{playerATWeekBest.playerInfo.pos == 'DEF' ? playerATWeekBest.playerID : playerATWeekBest.nflInfo.espn.t[playerATWeekBest.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATWeekBest.nflInfo.espn.t[playerATWeekBest.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATWeekBest.nflInfo.espn.t[playerATWeekBest.year].find(w => w.firstWeek <= playerATWeekBest.week && w.lastWeek >= playerATWeekBest.week).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATWeekBest.recordManID)}>
                                    {playerATWeekBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATWeekBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}
                                        <Cell class="center">{playerATWeekBest.year}</Cell>
                                    {/if}
                                <Cell class="center">{playerATWeekBest.week}</Cell>
                                <Cell class="center">{round(playerATWeekBest.playerPoints)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if playerWeekMissedBests && playerWeekMissedBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=9>
                                <p>
                                    Personal Biggest Benchwarmers – Players<br>
                                    {prefix} – {recordPrefix} 
                                </p>
                            </Cell>  
                        </Row>
                        <Row>
                            <Cell class="header rank"></Cell>
                            <Cell class="header rank" />
                            <Cell class="header">Player</Cell>
                            <Cell class="header">POS</Cell>
                            <Cell class="header">NFL Team</Cell>
                            <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                            <Cell class="header">Week</Cell>
                            <Cell class="header">PF</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerWeekMissedBests as playerATWeekMissedBest, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerATWeekMissedBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerATWeekMissedBest.playerInfo.fn} {playerATWeekMissedBest.playerInfo.ln}</Cell>
                                <Cell class="center">{playerATWeekMissedBest.playerInfo.pos}</Cell>
                                <Cell class="center">{playerATWeekMissedBest.playerInfo.pos == 'DEF' ? playerATWeekMissedBest.playerID : playerATWeekMissedBest.nflInfo.espn.t[playerATWeekMissedBest.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerATWeekMissedBest.nflInfo.espn.t[playerATWeekMissedBest.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerATWeekMissedBest.nflInfo.espn.t[playerATWeekMissedBest.year].find(w => w.firstWeek <= playerATWeekMissedBest.week && w.lastWeek >= playerATWeekMissedBest.week).team).sleeperID}</Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerATWeekMissedBest.recordManID)}>
                                    {playerATWeekMissedBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerATWeekMissedBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                    {#if allTime}
                                        <Cell class="center">{playerATWeekMissedBest.year}</Cell>
                                    {/if}
                                <Cell class="center">{playerATWeekMissedBest.week}</Cell>
                                <Cell class="center">{round(playerATWeekMissedBest.benchPoints)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>
    </div>
</div>
<div class="recordsWrap">
    <div class="columnWrap" style="width: 98%; flex-wrap: wrap;">
        <div class="buttonHolder">
            <Group variant="outlined">
                {#each tables as table, ix}
                    {#if (table == "Season Highs" || table == "Season Lows") && !allTime}
                        <div></div>
                    {:else}
                        {#if ix < 6}
                            <Button class="selectionButtons" on:click={() => curTable = ix} variant="{curTable == ix ? "raised" : "outlined"}">
                                <Label>{table}</Label>
                            </Button>
                        {/if}
                    {/if}
                {/each}
            </Group>
            <br />
            <Group variant="outlined">
                {#each tables as table, ix}
                    {#if (table == "Season Highs" || table == "Season Lows") && !allTime}
                        <div></div>
                    {:else}
                        {#if ix > 5}
                            <Button class="selectionButtons" on:click={() => curTable = ix} variant="{curTable == ix ? "raised" : "outlined"}">
                                <Label>{table}</Label>
                            </Button>
                        {/if}
                    {/if}
                {/each}
            </Group>
        </div>
    </div>
</div>
<div class="headerRow">
    <div class="headerLabel" style="justify-content: center">{prefix} Head To Head</div>
</div>
<div class="recordsWrap">
    <div class="columnWrap" style="width: 98%;">
        <div class="headToHeadWrap">
            <div class="headToHeadChoices">
                {#each managerChoicesLeft as manager}
                    <div class="columnWrap" style="width: 98%; align-items: flex-start;">
                        <div class="headToHeadRow" style="{displayManagerLeft && displayManagerLeft.info.realname == manager.info.realname ? "background-color: var(--gcSelect); border: 0.1em solid var(--g111);" : null}" on:click={() => changeManager(manager.recordManID, displayManagerRight?.recordManID, displayYear, selection)} >{manager.info.realname}</div>
                        {#if !allTime}
                            <div class="fantasyTeamName" style="padding: 0 4%;">({manager.info.name})</div>
                        {/if}
                    </div>
                {/each}
            </div>
            <div class="columnWrap" style="width: 58%;">
                <div class="headToHeadMain">
                    <div class="columnWrap" style="border-right: 0.1em dashed var(--gcBox); border-bottom: 0.1em dashed var(--gcBox);">
                        {#if displayManagerLeft}
                            <div class="managerProfile">
                                <img class="managerAvatar" src="{displayManagerLeft.info.avatar}" alt="">
                                <div class="managerName">
                                    {displayManagerLeft.info.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName" style="display: inline-flex; position: relative;" >({displayManagerLeft.info.name})</div>
                                    {/if}
                                </div>
                            </div>
                            <div class="headToHeadSummaryWrap">
                                <div class="columnWrap">
                                    <div class="headToHeadSummaryText">Wins:</div>
                                    {#if headToHeadShowTies.regular == true}
                                        <div class="headToHeadSummaryText">Ties:</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">EPE Wins:</div>
                                    {#if headToHeadShowTies.epe == true}
                                        <div class="headToHeadSummaryText">EPE Ties:</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">Points:</div>
                                </div>
                                <div class="columnWrap">
                                    <div class="headToHeadSummaryText">{displayManagerLeft.wins}</div>
                                    {#if headToHeadShowTies.regular == true}
                                        <div class="headToHeadSummaryText">{displayManagerLeft.ties}</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">{displayManagerLeft.epeWins}</div>
                                    {#if headToHeadShowTies.epe == true}
                                        <div class="headToHeadSummaryText">{displayManagerLeft.epeTies}</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">{round(displayManagerLeft.fpts)} ({round(displayManagerLeft.fptspg)})</div>
                                </div>
                            </div>
                        {/if}
                    </div>
                    <div class="columnWrap" style="border-left: 0.1em dashed var(--gcBox); border-bottom: 0.1em dashed var(--gcBox);">
                        {#if displayManagerRight}
                            <div class="managerProfile">
                                <img class="managerAvatar" src="{displayManagerRight.info.avatar}" alt="">
                                <div class="managerName">
                                    {displayManagerRight.info.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({displayManagerRight.info.name})</div>
                                    {/if}
                                </div>
                            </div>
                            <div class="headToHeadSummaryWrap">
                                <div class="columnWrap">
                                    <div class="headToHeadSummaryText">Wins:</div>
                                    {#if headToHeadShowTies.regular == true}
                                        <div class="headToHeadSummaryText">Ties:</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">EPE Wins:</div>
                                    {#if headToHeadShowTies.epe == true}
                                        <div class="headToHeadSummaryText">EPE Ties:</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">Points:</div>
                                </div>
                                <div class="columnWrap">
                                    <div class="headToHeadSummaryText">{displayManagerRight.wins}</div>
                                    {#if headToHeadShowTies.regular == true}
                                        <div class="headToHeadSummaryText">{displayManagerRight.ties}</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">{displayManagerRight.epeWins}</div>
                                    {#if headToHeadShowTies.epe == true}
                                        <div class="headToHeadSummaryText">{displayManagerRight.epeTies}</div>
                                    {/if}
                                    <div class="headToHeadSummaryText">{round(displayManagerRight.fpts)} ({round(displayManagerRight.fptspg)})</div>
                                </div>
                            </div>
                        {/if}
                    </div>
                </div>
                <div class="matchupSwitcher">
                    {#if displayManagerLeft && displayManagerRight && allMatchups.length > 0}
                        {#if selectedMatchup > 0}
                            <Icon class="material-icons changeMatchup" on:click={() => changeMatchup(selectedMatchup - 1)}>chevron_left</Icon>
                        {:else}
                            <span class="spacer" />
                        {/if}  
                        <div class="headingText">{displayMatchup.home.year} - Week {displayMatchup.home.week}</div>
                        {#if selectedMatchup < allMatchups.length - 1}
                            <Icon class="material-icons changeMatchup" on:click={() => changeMatchup(selectedMatchup + 1)}>chevron_right</Icon>
                        {:else}
                            <span class="spacer" />
                        {/if}  
                    {/if}
                </div>
                <div class="matchupWrap">
                    {#if displayManagerLeft && displayManagerRight}
                        <div class="matchupHolder" style="margin-left: -{100 * selectedMatchup}%; width: {100 * allMatchups.length}%">
                            {#each allMatchups as {home, away}}
                                <div class="matchup">
                                    <LeagueMatchup {home} {away} />
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            </div>
            <div class="headToHeadChoices">
                {#each managerChoicesRight as manager}
                    <div class="columnWrap" style="width: 98%; align-items: flex-end;">
                        <div class="headToHeadRow" on:click={() => changeManager(displayManagerLeft?.recordManID, manager.recordManID, displayYear, selection)} style="justify-content: flex-end; {displayManagerRight && displayManagerRight.info.realname == manager.info.realname ? "background-color: var(--gcSelect); border: 0.1em solid var(--g111);" : null}">{manager.info.realname}</div>
                        {#if !allTime}
                            <div class="fantasyTeamName" style="display: inline-flex; position: relative; justify-content: flex-end; padding: 0 4%;" >({manager.info.name})</div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>