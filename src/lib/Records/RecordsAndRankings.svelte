<script>
    import Button, { Group, Label } from '@smui/button';
    import BarChart from '../BarChart.svelte'
    import { generateGraph, gotoManager, round, managers, nflTeams } from '$lib/utils/helper';
    import { Icon } from '@smui/tab';
    import LeagueMatchup from './LeagueMatchup.svelte';

  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 

    export let selection = 'regular', displayPositionRecord = 'ALL', displayYear, waiversData, tradesData, transactions, weekRecords, weekLows, seasonLongRecords, leastSeasonLongPoints, showTies, winPercentages, fptsHistories, medianRecords, lineupIQs, prefix, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekMissedTOPS, playerWeekBests, playerWeekMissedBests, playerWeekTOPS, allManagers, displayObject, headToHeadRecords, leaguePlayerRecords, playerOverallBests, playerOverallMissedBests, playerPosBests, allTime=false;

    const leagueManagers = {};
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

    let numPositions;
    const getPlayerPosGraphs = (selection) => {
        let playerPosGraphs = [];
        numPositions = 0;
        for(const position of playerPosBests) {
            numPositions++;
            playerPosGraphs.push({
                position: position.position,
                Seasons: {
                    stats: displayObject[selection][`periodBest_${position.position}`].stats,
                    x: 'Manager',
                    y: 'Fantasy Points',
                    stat: '',
                    statCat: `periodBest_${position.position}`,
                    header: `Best Single-Season Performances by ${position.position}`,
                    field: 'playerPoints',
                    short: `${position.position}`,
                    category: 'Season',
                },
                Weeks: {
                    stats: displayObject[selection][`weekBest_${position.position}`].stats,
                    x: 'Manager',
                    y: 'Fantasy Points',
                    stat: '',
                    statCat: `weekBest_${position.position}`,
                    header: `Best Single-Week Performances by ${position.position}`,
                    field: 'playerPoints',
                    short: `${position.position}`,
                    category: 'Week',
                },
            })
        }
        return playerPosGraphs;
    }
    let playerPosGraphs = getPlayerPosGraphs(selection);
    $: getPlayerPosGraphs(selection);

    let lineupIQGraph = {
        stats: displayObject[selection].lineupIQs.stats,
        x: "Manager",
        y: "Lineup IQ",
        stat: "%",
        statCat: 'lineupIQs',
        header: "Manager Lineup IQ",
        field: "iq",
        short: "Lineup IQ"
    }
    $: lineupIQGraph.stats = displayObject[selection].lineupIQs.stats;

    let potentialPointsGraph = {
        stats: displayObject[selection].lineupIQs.stats,
        secondStats: displayObject[selection].lineupIQs.stats,
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
    $: potentialPointsGraph.stats = displayObject[selection].lineupIQs.stats;
    $: potentialPointsGraph.secondStats = displayObject[selection].lineupIQs.stats;

    let winsGraph = {
        stats: displayObject[selection].winPercentages.stats,
        x: "Manager",
        y: "Wins",
        stat: "",
        statCat: 'winPercentages',
        header: "Win Records",
        field: "wins",
        short: "Matchups"
    }
    $: winPercentagesGraph.stats = displayObject[selection].winPercentages.stats;

    let winPercentagesGraph = {
        stats: displayObject[selection].winPercentages.stats,
        x: "Manager",
        y: "Win %",
        stat: "%",
        statCat: 'winPercentages',
        header: "Win Percentages",
        field: "winPerc",
        short: "Win Percentage"
    }
    $: winPercentagesGraph.stats = displayObject[selection].winPercentages.stats;

    let fptsSeasonBestGraph = {
        stats: displayObject[selection].seasonBests.stats, 
        x: "Manager",
        y: "Fantasy PPG",
        stat: "",
        statCat: 'seasonBests',
        header: "Highest Scoring Seasons",
        field: "fptspg",
        short: "Best",
        category: "Seasons",
    }
    $: fptsSeasonBestGraph.stats = displayObject[selection].seasonBests.stats;

    let fptsSeasonWorstGraph = {
        stats: displayObject[selection].seasonWorsts.stats,
        x: "Manager",
        y: "Fantasy PPG",
        stat: "",
        statCat: 'seasonWorsts',
        header: "Lowest Scoring Seasons",
        field: "fptspg",
        short: "Worst",
        category: "Seasons",
    }
    $: fptsSeasonWorstGraph.stats = displayObject[selection].seasonWorsts.stats;

    let fptsWeekBestGraph = {
        stats: displayObject[selection].weekBests.stats,
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'weekBests',
        header: "Highest Scoring Weeks",
        field: "fpts",
        short: "Best",
        yMinOverride: 0,
        category: "Weeks",
    }
    $: fptsWeekBestGraph.stats = displayObject[selection].weekBests.stats;

    let fptsWeekWorstGraph = {
        stats: displayObject[selection].weekWorsts.stats, 
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'weekWorsts',
        header: "Lowest Scoring Weeks",
        field: "fpts",
        short: "Worst",
        yMinOverride: 0,
        category: "Weeks",
    }
    $: fptsWeekWorstGraph.stats = displayObject[selection].weekWorsts.stats;

    let fptsHistoriesGraph = {
        stats: displayObject[selection].fptsHistories.stats,
        x: "Manager",
        y: "Fantasy Points",
        stat: "",
        statCat: 'fptsHistories',
        header: "Fantasy Points",
        field: "fpts",
        short: "Scoring",
        classes: [
            {
                short: 'Totals',
                field: null,
                colors: null,
                totalField: null,
                keys: null,
            },
            {
                short: 'Positions',
                field: 'positionFpts',
                colors: {
                    QB: '#ff2a6d',
                    WR: '#58a7ff',
                    RB: '#00ceb8',
                    TE: '#ffae58',
                    K: '#bd66ff',
                    DEF: '#fff67a',
                    DL: '#ff795a',
                    LB: '#6d7df5',
                    DB: '#ff7cb6',
                },
                totalField: 'fpts',
                keys: ['DB', 'LB', 'DL', 'DEF', 'K', 'TE', 'RB', 'WR', 'QB'],
            },
            {
                short: 'Acquisitions',
                field: 'acquisitionFpts',
                colors: {
                    draft: "#A33B20",
                    waiver: "#4D9078",
                    trade: "#F2C14E",
                },
                totalField: 'fpts',
                keys: [
                    'trade',
                    'waiver',
                    'draft',
                ],
            },
        ],
    }
    const getPositionColors = (positionStats) => {
        fptsHistoriesGraph.classes[1].colors = {};
        for(const position in positionStats.positionFpts) {
            fptsHistoriesGraph.classes[1].colors[position] = positionColors[position];
        }
    }
    $: fptsHistoriesGraph.stats = displayObject[selection].fptsHistories.stats;
    $: fptsHistoriesGraph.classes[1].colors = getPositionColors(displayObject[selection].fptsHistories.stats);

    let medianRecordsGraph = {
        stats: displayObject[selection].medianRecords.stats,
        x: "Manager",
        y: "Median Win %",
        stat: "%",
        statCat: 'medianRecords',
        header: "Win Records Against League Median",
        field: "medianPerc",
        short: "Median"
    }
    $: medianRecordsGraph.stats = displayObject[selection].medianRecords.stats;

    let epeWinPercGraph = {
        stats: displayObject[selection].seasonEPERecords.stats,
        x: "Manager",
        y: "EPE Win %",
        stat: "%",
        statCat: 'seasonEPERecords',
        header: "Everyone Plays Everyone Win Record",
        field: "epePerc",
        short: "EPE",
    }
    $: epeWinPercGraph.stats = displayObject[selection].seasonEPERecords.stats;

    let playerSeasonBestGraph = {
        stats: displayObject[selection].playerSeasonBests.stats,
        x: "Manager",
        y: "Fantasy PPG",
        stat: "",
        statCat: 'playerSeasonBests',
        header: "Best Single-Season Performances",
        field: "playerPPStart",
        short: "Seasons",
        category: "Starters",
    }
    $: playerSeasonBestGraph.stats = displayObject[selection].playerSeasonBests.stats;

    let playerWeekBestGraph = {
        stats: displayObject[selection].playerWeekBests.stats,
        x: "Manager",
        y: "Total Fantasy Points",
        stat: "",
        statCat: 'playerWeekBests',
        header: "Best Single-Week Performances",
        field: "playerPoints",
        short: "Weeks",
        category: "Starters",
    }
    $: playerWeekBestGraph.stats = displayObject[selection].playerWeekBests.stats;

    let playerWeekMissedBestGraph = {
        stats: displayObject[selection].playerWeekMissedBests.stats,
        x: "Manager",
        y: "Bench Points",
        stat: "",
        statCat: 'playerWeekMissedBests',
        header: "Best Single-Week Benchwarmers",
        field: "benchPoints",
        short: "Weeks",
        category: "Bench",
    }
    $: playerWeekMissedBestGraph.stats = displayObject[selection].playerWeekMissedBests.stats;

    let playerOverallBestGraph = {
        stats: displayObject[selection].playerOverallBests.stats,
        x: "Manager",
        y: "Total Fantasy Points",
        stat: "",
        statCat: 'playerOverallBests',
        header: "Top Cumulative Scorers",
        field: "playerPoints",
        short: "Players",
    }
    $: playerOverallBestGraph.stats = displayObject[selection].playerOverallBests.stats;

    let playerOverallMissedBestGraph = {
        stats: displayObject[selection].playerOverallMissedBests.stats,
        x: "Manager",
        y: "Total Bench Points",
        stat: "",
        statCat: 'playerOverallMissedBests',
        header: "Top Cumulative Benchwarmers",
        field: "benchPoints",
        short: "Players",
    }
    $: playerOverallMissedBestGraph.stats = displayObject[selection].playerOverallMissedBests.stats;

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

    let movesGraph = {
        stats: displayObject[selection].transactions.stats,
        x: "Manager",
        y: "Transactions",
        stat: "",
        statCat: 'transactions',
        header: "Total Transactions",
        field: "moves",
        short: "Moves"
    }
    $: movesGraph.stats = displayObject[selection].transactions.stats;

    let tradesGraph = {
        stats: displayObject[selection].tradesData.stats,
        x: "Manager",
        y: "Trades",
        stat: "",
        statCat: 'tradesData',
        header: "Completed Trades",
        field: "trades",
        short: "Trades"
    }
    $: tradesGraph.stats = displayObject[selection].tradesData.stats;

    let waiversGraph = {
        stats: displayObject[selection].waiversData.stats,
        x: "Manager",
        y: "Pickups & Drops",
        stat: "",
        statCat: 'waiversData',
        header: "Waivers Transactions",
        field: "waivers",
        short: "Waivers"
    }
    $: waiversGraph.stats = displayObject[selection].waiversData.stats;


    const getGraph = (graphData, newHeader = null, newField = null, newStat = null, newY = null) => {
        let graph = graphData;
        if(newHeader) graph.header = newHeader;
        if(newField) graph.field = newField;
        if(newStat || newStat == '') graph.stat = newStat;
        if(newY) graph.y = newY;
        return generateGraph(graph);
    }

    const graphsObj = {
        Matchups: {
            Overall: {
                winPerc: getGraph(winPercentagesGraph),
                wins: getGraph(winPercentagesGraph, 'Wins', 'wins', '', 'Wins'),
                ties: getGraph(winPercentagesGraph, 'Ties', 'ties', '', 'Ties'),
                losses: getGraph(winPercentagesGraph, 'Losses', 'losses', '', 'Losses'),
            },
            EPE: {
                epePerc: getGraph(epeWinPercGraph),
                epeWins: getGraph(epeWinPercGraph, 'Everyone Plays Everyone - Wins', 'epeWins', '', 'EPE Wins'),
                epeTies: getGraph(epeWinPercGraph, 'Everyone Plays Everyone - Ties', 'epeTies', '', 'EPE Ties'),
                epeLosses: getGraph(epeWinPercGraph, 'Everyone Plays Everyone - Losses', 'epeLosses', '', 'EPE Losses'),
                topScores: getGraph(epeWinPercGraph, 'Weeks with Highest Score', 'topScores', '', 'Highest Scores'),
                bottomScores: getGraph(epeWinPercGraph, 'Weeks with Lowest Score', 'bottomScores', '', 'Lowest Scores'),
            },
            Median: {
                medianPerc: getGraph(medianRecordsGraph),
                weekWinners: getGraph(medianRecordsGraph, 'Above-Average Week Scores', 'epeWins', '', 'Median Wins'),
                weekTies: getGraph(medianRecordsGraph, 'Ties with Week Average', 'epeTies', '', 'Median Ties'),
                weekLosers: getGraph(medianRecordsGraph, 'Below-Average Week Scores', 'epeLosses', '', 'Median Losses'),
            }
        },
        Scoring: {
            Overall: {
                fpts: getGraph(fptsHistoriesGraph),
                fptspg: getGraph(fptsHistoriesGraph, 'Fantasy Points Per Game', 'fptspg', '', 'Fantasy PPG'),
                fptsAgainst: getGraph(fptsHistoriesGraph, 'Opponent Fantasy Points', 'fptsAgainst', '', 'Opponent Fantasy Points'),
            },
            Lineups: {
                potentialPoints: getGraph(potentialPointsGraph),
                iq: getGraph(potentialPointsGraph, 'Lineup IQs', 'iq', '%', 'IQ'),
                fpts: getGraph(potentialPointsGraph, 'Total Points', 'fpts', '%', 'Fantasy Points'),
            },
            Seasons: {
                Best: {
                    fptspg: getGraph(fptsSeasonBestGraph),
                    fpts: getGraph(fptsSeasonBestGraph, 'Highest Scoring Seasons', 'fpts', '', 'Fantasy Points'),
                },
                Worst: {
                    fptspg: getGraph(fptsSeasonWorstGraph),
                    fpts: getGraph(fptsSeasonWorstGraph, 'Lowest Scoring Seasons', 'fpts', '', 'Fantasy Points'),
                }
            },
            Weeks: {
                Best: {
                    fptspg: getGraph(fptsWeekBestGraph),
                    fpts: getGraph(fptsWeekBestGraph, 'Highest Scoring Weeks', 'fpts', '', 'Fantasy Points'),
                },
                Worst: {
                    fptspg: getGraph(fptsWeekWorstGraph),
                    fpts: getGraph(fptsWeekWorstGraph, 'Lowest Scoring Weeks', 'fpts', '', 'Fantasy Points'),
                }
            },
        },
        Players: {
            Overall: {
                Starters: {
                    playerPoints: getGraph(playerOverallBestGraph),
                },
                Bench: {
                    benchPoints: getGraph(playerOverallMissedBestGraph),
                },
            },
            Starters: {
                Seasons: {
                    playerPPStart: getGraph(playerSeasonBestGraph),
                    playerPoints: getGraph(playerSeasonBestGraph, 'Best Single-Season Performances', 'playerPoints', '', 'Fantasy Points'),
                },
                Weeks: {
                    playerPPStart: getGraph(playerWeekBestGraph),
                    playerPoints: getGraph(playerWeekBestGraph, 'Best Single-Week Performances', 'playerPoints', '', 'Fantasy Points'),
                }
            },
            Bench: {
                Weeks: {
                    benchPoints: getGraph(playerWeekMissedBestGraph),
                }
            },
            Positions: {},
        },
        Transactions: {
            Overall: {
                moves: getGraph(movesGraph),
            },
            Trades: {
                trades: getGraph(tradesGraph),
            },
            Waivers: {
                waivers: getGraph(waiversGraph),
                outbid: getGraph(waiversGraph, 'Failed Waiver Bids', 'outbid', '', 'Failed Bids'),
                waiverPerc: getGraph(waiversGraph, 'Waiver Bid Success Rates', 'waiverPerc', '%', 'Success Rate'),
            },
        },
    };

    for(const graph of playerPosGraphs) {
        graphsObj.Players.Positions[graph.position] = {
            Seasons: {
                playerPoints: getGraph(graph.Seasons),
            },
            Weeks: {
                playerPoints: getGraph(graph.Weeks),
            },
        }
    }

    let allManagerChoices = [];
    let allMatchups = [];
    let selectedMatchup;
    let managerChoicesLeft, managerChoicesRight;
    let displayManagerLeft, displayManagerRight;
 
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
    let curGraph = Object.keys(graphsObj)[0];
    let curSubType = 'Overall';
    let curDubType = Object.keys(graphsObj[curGraph][curSubType])[0];   
    let curPosType = curSubType == 'Positions' ? Object.keys(graphsObj[curGraph][curSubType][curDubType])[0] : null;

    let iqOffset = 0;
    const tables = [
        "Win Percentages",
        "Scoring",
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

    let oldGraph = curGraph;
    const changeTable = (newGraph, newSubType, newDubType, newPosType) => {
       
       
        if(newGraph != oldGraph) {
            curSubType = 'Overall';
            curDubType = Object.keys(graphsObj[newGraph][curSubType])[0];
            curPosType = curSubType == 'Positions' ? Object.keys(graphsObj[newGraph][curSubType][curDubType])[0] : null;
            newSubType = curSubType;
            newDubType = curDubType;
            newPosType = curPosType;
            oldGraph = newGraph;
        }
        if(newGraph == 'Matchups') {
            if(newSubType == 'Overall') {
                curTable = 1 - iqOffset;
            } else if(newSubType == 'EPE') {
                curTable = 9 - iqOffset;
            } else if(newSubType == 'Median') {
                curTable = 3 - iqOffset;
            }
        } else if(newGraph == 'Scoring') {
            if(newSubType == 'Overall') {
                curTable = 2 - iqOffset;
            } else if(newSubType == 'Lineups') {
                curTable = 0;
            } else if(newSubType == 'Seasons') {
                if(newDubType == 'Best') {
                    curTable = 5 - iqOffset;
                } else if(newDubType == 'Worst') {
                    curTable = 6 - iqOffset;
                }
            } else if(newSubType == 'Weeks') {
                if(newDubType == 'Best') {
                    curTable = 7 - iqOffset;
                } else if(newDubType == 'Worst') {
                    curTable = 8 - iqOffset;
                }
            }
        } else if(newGraph == 'Players') {
            if(newSubType == 'Overall') {
                if(newDubType == 'Starters') {
                    curTable = 13 - iqOffset;
                } else if(newDubType == 'Bench') {
                    curTable = 14 - iqOffset;
                }
            } else if(newSubType == 'Starters') {
                if(newDubType == 'Seasons') {
                    curTable = 10 - iqOffset;
                } else if(newDubType == 'Weeks') {
                    curTable = 11 - iqOffset;
                }
            } else if(newSubType == 'Bench') {
                if(newDubType == 'Weeks') {
                    curTable = 12 - iqOffset;
                }
            } else if(newSubType == 'Positions') {
                for(const position of playerPosGraphs) {
                    if(newPosType == 'Seasons') {
                        if(newDubType == position.position) {
                            curTable = 15 - iqOffset + 2 * playerPosGraphs.indexOf(position);
                            break;
                        }
                    } else if(newPosType == 'Weeks') {
                        if(newDubType == position.position) {
                            curTable = 16 - iqOffset + 2 * playerPosGraphs.indexOf(position);
                            break;
                        }
                    }
                }
            }
        } else if(newGraph == 'Transactions') {
            if(newSubType == 'Overall') {
                curTable = 4 - iqOffset;
            } else if(newSubType == 'Trades') {
                curTable = 4 - iqOffset;
            } else if(newSubType == 'Waivers') {
                curTable = 4 - iqOffset;
            }
        }
    }

    $: changeTable(curGraph, curSubType, curDubType, curPosType);

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

    let rand = 1;
    let curSort = {
        sort: null,
        inverted: false,
    };
    const changeSort = (arrayName, recordArray, newKey, inverted = false) => {
        let newRecordArray = recordArray;
        if(displayObject[selection][arrayName].sort == newKey) {
            if(displayObject[selection][arrayName].inverted == false) {
                newRecordArray = newRecordArray.sort((a, b) => a[newKey] - b[newKey]);
                displayObject[selection][arrayName].inverted = true;
                curSort.inverted = true;
            } else {
                newRecordArray = newRecordArray.sort((a, b) => b[newKey] - a[newKey]);
                displayObject[selection][arrayName].inverted = false;
                curSort.inverted = false;
            }
        } else {
            if(inverted == false) {
                newRecordArray = newRecordArray.sort((a, b) => b[newKey] - a[newKey]);
                displayObject[selection][arrayName].sort = newKey;
            } else {
                newRecordArray = newRecordArray.sort((a, b) => a[newKey] - b[newKey]);
                displayObject[selection][arrayName].sort = newKey;
            }
        } 
        rand = rand * Math.random();
        curSort.sort = newKey;
    }
    
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
        width: 1500%;
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
        width: 90%;
        padding: 0 4%;
        height: 2.5em;
        align-items: center;
    }

    .headToHeadRow:hover {
        cursor: pointer;
        background-color: var(--gcSelect);
        border: 0.1em solid var(--g111);
        height: 2.5em;
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

    :global(.changeSort) {
        position: absolute;
        margin: 2px 0 0 7px;
        font-size: 1.05em;
        cursor: pointer;
    }

    .QB {
		background-color: var(--QB);
	}

	.WR {
		background-color: var(--WR);
	}

	.RB {
		background-color: var(--RB);
	}

	.TE {
		background-color: var(--TE);
	}

	.K {
		background-color: var(--K);
	}

	.DEF {
		background-color: var(--DEF);
	}

    .DL, .DE, .DT {
        background-color: var(--DL);
    }

    .LB {
        background-color: var(--LB);
    }

    .DB, .CB, .SS, .FS {
        background-color: var(--DB);
    }

    .pos {
        display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: 7px;
        max-width: 28px;
        min-width: 28px;
		height: 28px;
    }

    .teamAvatar {
        display: inline-flex;
		align-items: center;
		justify-content: center;
        height: 35px;
        max-height: 35px;
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
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort" on:click={() => changeSort('seasonLongRecords', seasonLongRecords, 'fpts')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonLongRecords', seasonLongRecords, 'fptspg')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonLongRecords as mostSeasonLongPoint, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                            {/if}
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
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('leastSeasonLongPoints', leastSeasonLongPoints, 'fpts')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort"on:click={() => changeSort('leastSeasonLongPoints', leastSeasonLongPoints, 'fptspg')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each leastSeasonLongPoints as leastSeasonLongPoint, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                            {/if}
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
                                    <Cell class="center">
                                        <div class="pos {playerATWeekTOP.playerInfo.pos}">
                                            {playerATWeekTOP.playerInfo.pos}
                                        </div>
                                    </Cell>
                                {/if}
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATWeekTOP.team.toLowerCase()}.png" alt="{playerATWeekTOP.team}">
                                </Cell>
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
                            <Cell class="header">
                                Led Team
                                <Icon class="material-icons changeSort" on:click={() => changeSort('playerSeasonTOPS', playerSeasonTOPS, 'topStarters')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Avg Rank
                                <Icon class="material-icons changeSort" on:click={() => changeSort('playerSeasonTOPS', playerSeasonTOPS, 'starterRankAVG', true)}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Starts
                                <Icon class="material-icons changeSort" on:click={() => changeSort('playerSeasonTOPS', playerSeasonTOPS, 'weeksStarted')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort" on:click={() => changeSort('playerSeasonTOPS', playerSeasonTOPS, 'playerPoints')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort" on:click={() => changeSort('playerSeasonTOPS', playerSeasonTOPS, 'playerPPStart')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerSeasonTOPS as playerATSeasonTOP, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
                                <Row>
                                    <Cell class="rank">{ix + 1}</Cell>
                                    <Cell class="playerAvatar playerInfo" style="{playerATSeasonTOP.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                    <Cell class="left">{playerATSeasonTOP.playerInfo.fn} {playerATSeasonTOP.playerInfo.ln}</Cell>
                                    {#if displayPositionRecord == 'ALL'}
                                        <Cell class="center">
                                            <div class="pos {playerATSeasonTOP.playerInfo.pos}">
                                                {playerATSeasonTOP.playerInfo.pos}
                                            </div>
                                        </Cell>
                                    {/if}
                                    <Cell class="center">
                                        <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATSeasonTOP.team.toLowerCase()}.png" alt="{playerATSeasonTOP.team}">
                                    </Cell>
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
                            {/if}
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
                                    <Cell class="center">
                                        <div class="pos {playerATWeekMissedTOP.playerInfo.pos}">
                                            {playerATWeekMissedTOP.playerInfo.pos}
                                        </div>
                                    </Cell>
                                {/if}
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATWeekMissedTOP.team.toLowerCase()}.png" alt="{playerATWeekMissedTOP.team}">
                                </Cell>
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


<BarChart maxWidth={innerWidth} {graphsObj} {displayObject} {leagueManagers} {allManagers} bind:displayYear={displayYear} bind:selection={selection} bind:allTime={allTime} bind:curGraph={curGraph} bind:curTableDesc={curTableDesc} bind:curSubType={curSubType} bind:curDubType={curDubType} bind:curPosType={curPosType} bind:curSort={curSort} />

<div class="rankingHolder">
    <div class="rankingInner" style="margin-left: -{100 * curTable}%; width: {1500 + 200*numPositions}%;">
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
                            <Cell class="header">
                                IQ
                                <Icon class="material-icons changeSort"on:click={() => changeSort('lineupIQs', lineupIQs, 'iq')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('lineupIQs', lineupIQs, 'fpts')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Poss. PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('lineupIQs', lineupIQs, 'potentialPoints')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each lineupIQs as lineupIQ, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                            {/if}
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
                        <Cell class="header">
                            Win %
                            <Icon class="material-icons changeSort"on:click={() => changeSort('winPercentages', winPercentages, 'winPerc')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            W
                            <Icon class="material-icons changeSort"on:click={() => changeSort('winPercentages', winPercentages, 'wins')}>filter_list</Icon>
                        </Cell>
                            {#if showTies.regular == true}
                                <Cell class="header">
                                    T
                                    <Icon class="material-icons changeSort"on:click={() => changeSort('winPercentages', winPercentages, 'ties')}>filter_list</Icon>
                                </Cell>
                            {/if}
                        <Cell class="header">
                            L
                            <Icon class="material-icons changeSort"on:click={() => changeSort('winPercentages', winPercentages, 'losses')}>filter_list</Icon>
                        </Cell>	   
                    </Row>
                </Head>
                <Body>
                    {#each winPercentages as winPercentage, ix (rand * (ix + 1))}
                        {#if rand == 0}
                            nothing
                        {:else}
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
                                {#if showTies.regular == true}
                                    <Cell class="center">{winPercentage.ties}</Cell>
                                {/if}
                                <Cell class="center">{winPercentage.losses}</Cell>			
                            </Row>
                        {/if}
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
                        <Cell class="header">
                            PF
                            <Icon class="material-icons changeSort"on:click={() => changeSort('fptsHistories', fptsHistories, 'fpts')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            PA
                            <Icon class="material-icons changeSort"on:click={() => changeSort('fptsHistories', fptsHistories, 'fptsAgainst')}>filter_list</Icon>
                        </Cell>
			            <Cell class="header">
                            PPG
                            <Icon class="material-icons changeSort"on:click={() => changeSort('fptsHistories', fptsHistories, 'fptspg')}>filter_list</Icon>
                        </Cell>
                    </Row>
                </Head>
                <Body>
                    {#each fptsHistories as fptsHistory, ix (rand * (ix + 1))}
                        {#if rand == 0}
                            nothing
                        {:else}
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
                        {/if}
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=6>
                            <p>
                                Managers Against the Median Rankings<br>
                                {prefix} – {recordPrefix} 
                            </p>
                        </Cell>   
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">
                            Median Win %
                            <Icon class="material-icons changeSort"on:click={() => changeSort('medianRecords', medianRecords, 'medianPerc')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            W
                            <Icon class="material-icons changeSort"on:click={() => changeSort('medianRecords', medianRecords, 'weekWinners')}>filter_list</Icon>
                        </Cell>
                        {#if showTies.median == true}
                            <Cell class="header">
                                T
                                <Icon class="material-icons changeSort"on:click={() => changeSort('medianRecords', medianRecords, 'weekTies')}>filter_list</Icon>
                            </Cell>
                        {/if}
                        <Cell class="header">
                            L
                            <Icon class="material-icons changeSort"on:click={() => changeSort('medianRecords', medianRecords, 'weekLosers')}>filter_list</Icon>
                        </Cell>
                    </Row>
                </Head>
                <Body>
                    {#each medianRecords as medianRecord, ix (rand * (ix + 1))}
                        {#if rand == 0}
                            nothing
                        {:else}
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
                                {#if showTies.median == true}
                                    <Cell class="center">{medianRecord.weekTies}</Cell>
                                {/if}
                                <Cell class="center">{medianRecord.weekLosers}</Cell>
                            </Row>
                        {/if}
                    {/each}
                </Body>
            </DataTable>
        </div>

        <div class="rankingTableWrapper">
            <DataTable class="rankingTable">
                <Head>
                    <Row>
                        <Cell class="header" colspan=6>
                            {prefix} Transaction Totals
                        </Cell>
                    </Row>
                    <Row>
                        <Cell class="header"></Cell>
                        <Cell class="header">Manager</Cell>
                        <Cell class="header">
                            Trades
                            <Icon class="material-icons changeSort"on:click={() => changeSort('transactions', transactions, 'trades')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            Waivers
                            <Icon class="material-icons changeSort"on:click={() => changeSort('transactions', transactions, 'waivers')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            Outbid
                            <Icon class="material-icons changeSort"on:click={() => changeSort('transactions', transactions, 'outbid')}>filter_list</Icon>
                        </Cell>
                        <Cell class="header">
                            Win %
                            <Icon class="material-icons changeSort"on:click={() => changeSort('transactions', transactions, 'waiverPerc')}>filter_list</Icon>
                        </Cell>
                    </Row>
                </Head>
                <Body>
                    {#each transactions as transaction, ix (rand * (ix + 1))}
                        {#if rand == 0}
                            nothing
                        {:else}
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
                                <Cell class="center">{transaction.outbid}</Cell>
                                <Cell class="center">{transaction.waiverPerc == 'N/A' ? transaction.waiverPerc : round(transaction.waiverPerc)}</Cell>
                            </Row>
                        {/if}
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
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonBests', seasonBests, 'fpts')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonBests', seasonBests, 'fptspg')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonBests as allTimeSeasonBest, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                            {/if}
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
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonWorsts', seasonWorsts, 'fpts')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonWorsts', seasonWorsts, 'fptspg')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonWorsts as allTimeSeasonWorst, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                            {/if}
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
                            <Cell class="header">
                                EPE Win %
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'epePerc')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                W
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'epeWins')}>filter_list</Icon>
                            </Cell>
                            {#if showTies.epe == true}
                                <Cell class="header">
                                    T
                                    <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'epeTies')}>filter_list</Icon>
                                </Cell>
                            {/if}
                            <Cell class="header">
                                L
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'epeLosses')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Top Score
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'topScores')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Bot Score
                                <Icon class="material-icons changeSort"on:click={() => changeSort('seasonEPERecords', seasonEPERecords, 'bottomScores')}>filter_list</Icon>
                            </Cell>	
                        </Row>
                    </Head>
                    <Body>
                        {#each seasonEPERecords as allTimeEPERecord, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
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
                                    {#if showTies.epe == true}
                                        <Cell class="center">{allTimeEPERecord.epeTies}</Cell>
                                    {/if}
                                    <Cell class="center">{allTimeEPERecord.epeLosses}</Cell>
                                    <Cell class="center">{allTimeEPERecord.topScores}</Cell>
                                    <Cell class="center">{allTimeEPERecord.bottomScores}</Cell>
                                </Row>
                            {/if}
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
                            <Cell class="header">
                                Led Team
                                <Icon class="material-icons changeSort"on:click={() => changeSort('playerSeasonBests', playerSeasonBests, 'topStarters')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Avg Rank
                                <Icon class="material-icons changeSort"on:click={() => changeSort('playerSeasonBests', playerSeasonBests, 'starterRankAVG', true)}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                Starts
                                <Icon class="material-icons changeSort"on:click={() => changeSort('playerSeasonBests', playerSeasonBests, 'weeksStarted')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PF
                                <Icon class="material-icons changeSort"on:click={() => changeSort('playerSeasonBests', playerSeasonBests, 'playerPoints')}>filter_list</Icon>
                            </Cell>
                            <Cell class="header">
                                PPG
                                <Icon class="material-icons changeSort"on:click={() => changeSort('playerSeasonBests', playerSeasonBests, 'playerPPStart')}>filter_list</Icon>
                            </Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerSeasonBests as playerATSeasonBest, ix (rand * (ix + 1))}
                            {#if rand == 0}
                                nothing
                            {:else}
                                <Row>
                                    <Cell class="rank">{ix + 1}</Cell>
                                    <Cell class="playerAvatar playerInfo" style="{playerATSeasonBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                    <Cell class="left">{playerATSeasonBest.playerInfo.fn} {playerATSeasonBest.playerInfo.ln}</Cell>
                                    <Cell class="center">
                                        <div class="pos {playerATSeasonBest.playerInfo.pos}">
                                            {playerATSeasonBest.playerInfo.pos}
                                        </div>
                                    </Cell>
                                    <Cell class="center">
                                        <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATSeasonBest.team.toLowerCase()}.png" alt="{playerATSeasonBest.team}">
                                    </Cell>
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
                            {/if}
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
                                <Cell class="center">
                                    <div class="pos {playerATWeekBest.playerInfo.pos}">
                                        {playerATWeekBest.playerInfo.pos}
                                    </div>
                                </Cell>
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATWeekBest.team.toLowerCase()}.png" alt="{playerATWeekBest.team}">
                                </Cell>
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
                                <Cell class="center">
                                    <div class="pos {playerATWeekMissedBest.playerInfo.pos}">
                                        {playerATWeekMissedBest.playerInfo.pos}
                                    </div>
                                </Cell>
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerATWeekMissedBest.team.toLowerCase()}.png" alt="{playerATWeekMissedBest.team}">
                                </Cell>
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

        <div class="rankingTableWrapper">
            {#if playerOverallBests && playerOverallBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=10>
                                <p>
                                    {#if allTime}
                                        Highest Cumulative Scorers – Players<br>
                                    {:else}
                                        Most Starting & Bench Points - Players<br>
                                    {/if}
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
                                <Cell class="header">Years</Cell>
                            {/if}
                            <Cell class="header">{allTime ? 'Starts' : 'Rostered'}</Cell>
                            <Cell class="header">PF</Cell>
                            <Cell class="header">PPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerOverallBests as playerOverallBest, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerOverallBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerOverallBest.playerInfo.fn} {playerOverallBest.playerInfo.ln}</Cell>
                                <Cell class="center">
                                    <div class="pos {playerOverallBest.playerInfo.pos}">
                                        {playerOverallBest.playerInfo.pos}
                                    </div>
                                </Cell>
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerOverallBest.team.toLowerCase()}.png" alt="{playerOverallBest.team}">
                                </Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerOverallBest.recordManID)}>
                                    {playerOverallBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerOverallBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                {#if allTime}
                                    <Cell class="center">{playerOverallBest.yearsOwned}</Cell>
                                {/if}
                                <Cell class="center">{allTime ? playerOverallBest.weeksStarted : playerOverallBest.weeksOwned}</Cell>
                                <Cell class="center">{allTime ? round(playerOverallBest.playerPoints) : round(playerOverallBest.totalFpts)}</Cell>
                                <Cell class="center">{allTime ? round(playerOverallBest.playerPPStart) : round(playerOverallBest.totalFpts / playerOverallBest.weeksOwned)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        <div class="rankingTableWrapper">
            {#if playerOverallMissedBests && playerOverallMissedBests.length}
                <DataTable class="rankingTable">
                    <Head>
                        <Row>
                            <Cell class="header" colspan=10>
                                <p>
                                    {#if allTime}
                                        Top Cumulative Benchwarmers – Players<br>
                                    {:else}
                                        Most Starting & Bench Points - Players<br>
                                    {/if}
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
                                <Cell class="header">Years</Cell>
                            {/if}
                            <Cell class="header">{allTime ? 'Benched' : 'Rostered'}</Cell>
                            <Cell class="header">BP</Cell>
                            <Cell class="header">BPPG</Cell>
                        </Row>
                    </Head>
                    <Body>
                        {#each playerOverallMissedBests as playerOverallMissedBest, ix}
                            <Row>
                                <Cell class="rank">{ix + 1}</Cell>
                                <Cell class="playerAvatar playerInfo" style="{playerOverallMissedBest.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                <Cell class="left">{playerOverallMissedBest.playerInfo.fn} {playerOverallMissedBest.playerInfo.ln}</Cell>
                                <Cell class="center">
                                    <div class="pos {playerOverallMissedBest.playerInfo.pos}">
                                        {playerOverallMissedBest.playerInfo.pos}
                                    </div>
                                </Cell>
                                <Cell class="center">
                                    <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{playerOverallMissedBest.team.toLowerCase()}.png" alt="{playerOverallMissedBest.team}">
                                </Cell>
                                <Cell class="cellName" on:click={() => gotoManager(playerOverallMissedBest.recordManID)}>
                                    {playerOverallMissedBest.manager.realname}
                                    {#if !allTime}
                                        <div class="fantasyTeamName">({playerOverallMissedBest.manager.name})</div>
                                    {/if}
                                </Cell>
                                {#if allTime}
                                    <Cell class="center">{playerOverallMissedBest.yearsOwned}</Cell>
                                {/if}
                                <Cell class="center">{allTime ? playerOverallMissedBest.weeksBenched : playerOverallMissedBest.weeksOwned}</Cell>
                                <Cell class="center">{allTime ? round(playerOverallMissedBest.benchPoints) : round(playerOverallMissedBest.totalFpts)}</Cell>
                                <Cell class="center">{allTime ? round(playerOverallMissedBest.benchPPG) : round(playerOverallMissedBest.totalFpts / playerOverallMissedBest.weeksOwned)}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>

        {#each playerPosGraphs as position}
            <div class="rankingTableWrapper">
                {#if position.Seasons.stats && position.Seasons.stats.length}
                    <DataTable class="rankingTable">
                        <Head>
                            <Row>
                                <Cell class="header" colspan=11>
                                    <p>
                                        Best Single-Season Performances - {position.position}<br>
                                        {prefix} – {recordPrefix} 
                                    </p>
                                </Cell>  
                            </Row>
                            <Row>
                                <Cell class="header rank"></Cell>
                                <Cell class="header rank" />
                                <Cell class="header">Player</Cell>
                                {#if position.position != 'DEF'}
                                    <Cell class="header">NFL Team</Cell>
                                {/if}
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
                            {#each position.Seasons.stats as player, ix}
                                <Row>
                                    <Cell class="rank">{ix + 1}</Cell>
                                    <Cell class="playerAvatar playerInfo" style="{player.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                    <Cell class="left">{player.playerInfo.fn} {player.playerInfo.ln}</Cell>
                                    {#if position.position != 'DEF'}
                                        <Cell class="center">
                                            <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{player.team.toLowerCase()}.png" alt="{player.team}">
                                        </Cell>
                                    {/if}
                                    <Cell class="cellName" on:click={() => gotoManager(player.recordManID)}>
                                        {player.manager.realname}
                                        {#if !allTime}
                                            <div class="fantasyTeamName">({player.manager.name})</div>
                                        {/if}
                                    </Cell>
                                    {#if allTime}
                                        <Cell class="center">{player.year}</Cell>
                                    {/if}
                                    <Cell class="center">{player.topStarters}</Cell>
                                    <Cell class="center">{round(player.starterRankAVG)}</Cell>
                                    <Cell class="center">{player.weeksStarted} / {player.weeksOwned}</Cell>
                                    <Cell class="center">{round(player.playerPoints)}</Cell>
                                    <Cell class="center">{round(player.playerPPStart)}</Cell>
                                </Row>
                            {/each}
                        </Body>
                    </DataTable>
                {/if}
            </div>
            <div class="rankingTableWrapper">
                {#if position.Weeks.stats && position.Weeks.stats.length}
                    <DataTable class="rankingTable">
                        <Head>
                            <Row>
                                <Cell class="header" colspan=8>
                                    <p>
                                        Best Single-Week Performances – {position.position}<br>
                                        {prefix} – {recordPrefix} 
                                    </p>
                                </Cell>  
                            </Row>
                            <Row>
                                <Cell class="header rank"></Cell>
                                <Cell class="header rank" />
                                <Cell class="header">Player</Cell>
                                {#if position.position != 'DEF'}
                                    <Cell class="header">NFL Team</Cell>
                                {/if}
                                <Cell class="header">Manager</Cell>
                                {#if allTime}
                                    <Cell class="header">Year</Cell>
                                {/if}
                                <Cell class="header">Week</Cell>
                                <Cell class="header">PF</Cell>
                            </Row>
                        </Head>
                        <Body>
                            {#each position.Weeks.stats as player, ix}
                                <Row>
                                    <Cell class="rank">{ix + 1}</Cell>
                                    <Cell class="playerAvatar playerInfo" style="{player.avatar}; vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                    <Cell class="left">{player.playerInfo.fn} {player.playerInfo.ln}</Cell>
                                    {#if position.position != 'DEF'}
                                        <Cell class="center">
                                            <img class="teamAvatar" src="https://sleepercdn.com/images/team_logos/nfl/{player.team.toLowerCase()}.png" alt="{player.team}">
                                        </Cell>
                                    {/if}
                                    <Cell class="cellName" on:click={() => gotoManager(player.recordManID)}>
                                        {player.manager.realname}
                                        {#if !allTime}
                                            <div class="fantasyTeamName">({player.manager.name})</div>
                                        {/if}
                                    </Cell>
                                    {#if allTime}
                                        <Cell class="center">{player.year}</Cell>
                                    {/if}
                                    <Cell class="center">{player.week}</Cell>
                                    <Cell class="center">{round(player.playerPoints)}</Cell>
                                </Row>
                            {/each}
                        </Body>
                    </DataTable>
                {/if}
            </div>
        {/each}
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