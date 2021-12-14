<script>
  	import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 
    import Button, { Group, Label } from '@smui/button';
    import { Icon } from '@smui/tab';
    import { gotoManager, round, nflTeams } from '$lib/utils/helper';
    import { getManagerRecords } from '$lib/utils/helper';
    import { managerrecords } from '$lib/stores';
    import LeagueMatchup from '$lib/Records/LeagueMatchup.svelte';


    export let recordManID, firstYear, currentYear, managerRecords;

    let showEmpty = false;
    let emptyMessage;
    let selection = 'regular'; 
    let displayPositionRecord = 'ALL';
    let recordPrefix;
    let masterSelection = 'alltime';
    let masterPrefix;
    let selectedYear = currentYear;

    let weekBests, weekWorsts, periodBests, periodWorsts, blowoutBests, blowoutWorsts, narrowBests, narrowWorsts, playerWeekBests, playerWeekMissedBests, playerPeriodBests, headToHeads, headToHeadRecords, managerPlayerRecords;
    let headShowTies = false;
    let headShowTiesEPE = false;

    let positionsArray = [];

    let managerChoicesLeft = [];
    let managerChoicesRight = [];

    let displayManagerLeft;

    const refreshRecords = async () => {
        const newRecords = await getManagerRecords(managerrecords);
        managerrecords.update(() => newRecords);
        managerRecords = newRecords;
        refreshTables(managerRecords);
    }
  
    refreshRecords(managerrecords);

    const refreshTables = () => {
        if(managerRecords) {
            displayManagerLeft = {
                info: managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][recordManID - 1]?.manager || managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][recordManID + 1].manager,
                recordManID,
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

            managerChoicesLeft = [];
            managerChoicesLeft.push({
                info: managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][recordManID - 1]?.manager || managerRecords.headToHeadRecords.regularSeason.alltime[recordManID][recordManID + 1].manager,
                recordManID,
            })


            if(displayStats == 'regular') {
                setRegularTable(managerRecords, displayType, displayYear, displayPositionRecord);
            } else if(displayStats == 'playoffs') {
                setPlayoffsTable(managerRecords, displayType, displayYear, displayPositionRecord);
            } else if(displayStats == 'combined') {
                setCombinedTable(managerRecords, displayType, displayYear, displayPositionRecord);
            }
        }   
    }

    const setRegularTable = (managerRecords, displayType, displayYear, displayPositionRecord) => {
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

            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.alltime;
            managerPlayerRecords = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.regularSeason.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.alltime.regularSeason[recordManID][displayPositionRecord].week_MissedTop;
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

            managerPlayerRecords = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].regularSeason.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.years[displayYear].regularSeason[recordManID][displayPositionRecord].week_MissedTop;
            }

            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.years[displayYear];

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

    const setPlayoffsTable = (managerRecords, displayType, displayYear, displayPositionRecord) => {
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

            managerPlayerRecords = managerRecords.playerPositionRecords.alltime.playoffs[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.playoffs.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.alltime.playoffs[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.alltime.playoffs[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.alltime.playoffs[recordManID][displayPositionRecord].week_MissedTop;
            }

            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.alltime;

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

            managerPlayerRecords = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.years[displayYear].playoffs.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].playoffs.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].playoffs.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.years[displayYear].playoffs[recordManID][displayPositionRecord].week_MissedTop;
            }

            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.years[displayYear];

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

    const setCombinedTable = (managerRecords, displayType, displayYear, displayPositionRecord) => {
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

            managerPlayerRecords = managerRecords.playerPositionRecords.alltime.combined[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.alltime.combined.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.alltime.combined[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.alltime.combined[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.alltime.combined[recordManID][displayPositionRecord].week_MissedTop;
            }

            headToHeadRecords = managerRecords.headToHeadRecords.combined.alltime;

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

            managerPlayerRecords = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID];

            if(displayPositionRecord == 'ALL') {
                playerWeekBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].week_Best;
                playerPeriodBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].period_Best;
                playerWeekMissedBests = managerRecords.managerRecordArrays.years[displayYear].combined.players[recordManID].week_MissedBest;
            } else {
                playerWeekBests = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID][displayPositionRecord].week_Top;
                playerPeriodBests = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID][displayPositionRecord].period_Top;
                playerWeekMissedBests = managerRecords.playerPositionRecords.years[displayYear].combined[recordManID][displayPositionRecord].week_MissedTop;
            }

            headToHeadRecords = managerRecords.headToHeadRecords.combined.years[displayYear];

            for(const opponent in managerRecords.headToHeadRecords.combined.years[displayYear][recordManID]) {
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
        refreshTables(displayStats);
    }
    $: changeSelection(selection);

    let displayType;
    const changeMasterSelection = (masterSelection) => {
        displayType = masterSelection;
        refreshTables(displayType);
    }
    $: changeMasterSelection(masterSelection);

    let displayYear;
    const changeYear = (selectedYear) => {
        displayYear = selectedYear;
        refreshTables(displayYear);
    }
    $: changeYear(selectedYear);

    let allManagerChoices = [];
    let allMatchups = [];
    let selectedMatchup;

    let displayManagerRight;
 
    const getHead = (headToHeadRecords) => {
        allManagerChoices = [];
        for(const manager in headToHeadRecords) {
            if(manager != recordManID && headToHeadRecords[manager][recordManID].epeWins + headToHeadRecords[manager][recordManID].epeTies + headToHeadRecords[manager][recordManID].epeLosses > 0) {
                allManagerChoices.push({
                    info: headToHeadRecords[manager][recordManID].manager,
                    recordManID: manager,
                });
            }
        }
        managerChoicesRight = allManagerChoices;
        displayManagerRight = null;
        allMatchups = [];
        selectedMatchup = null;

        return allManagerChoices;
    }
    $: getHead(headToHeadRecords);

    managerChoicesRight = getHead(headToHeadRecords);

    let headToHeadShowTies = {
        regular: false,
        epe: false,
    }

    const changeManager = (newManagerRight, headToHeadRecords) => {

        if(newManagerRight) {
            displayManagerLeft.wins = headToHeadRecords[recordManID][newManagerRight].wins;
            displayManagerLeft.ties = headToHeadRecords[recordManID][newManagerRight].ties;
            displayManagerLeft.fpts = headToHeadRecords[recordManID][newManagerRight].fpts;
            displayManagerLeft.fptspg = headToHeadRecords[recordManID][newManagerRight].fptspg;
            displayManagerLeft.epeWins = headToHeadRecords[recordManID][newManagerRight].epeWins;
            displayManagerLeft.epeTies = headToHeadRecords[recordManID][newManagerRight].epeTies;
            displayManagerLeft.winPerc = headToHeadRecords[recordManID][newManagerRight].winPerc;
            displayManagerLeft.epePerc = headToHeadRecords[recordManID][newManagerRight].epePerc;

            displayManagerLeft.matchups = headToHeadRecords[recordManID][newManagerRight].matchups;

            displayManagerLeft.specialMatchups.highScore = headToHeadRecords[recordManID][newManagerRight].highScore;
            displayManagerLeft.specialMatchups.lowScore = headToHeadRecords[recordManID][newManagerRight].lowScore;
            displayManagerLeft.specialMatchups.bestBlowout = headToHeadRecords[recordManID][newManagerRight].bestBlowout;
            displayManagerLeft.specialMatchups.worstBlowout = headToHeadRecords[recordManID][newManagerRight].worstBlowout;
            displayManagerLeft.specialMatchups.bestNailbiter = headToHeadRecords[recordManID][newManagerRight].bestNailbiter;
            displayManagerLeft.specialMatchups.worstNailbiter = headToHeadRecords[recordManID][newManagerRight].worstNailbiter;

            if(displayManagerLeft.ties > 0) {
                headToHeadShowTies.regular = true;
            }
            if(displayManagerLeft.epeTies > 0) {
                headToHeadShowTies.epe = true;
            }
        
            displayManagerRight = {
                info: headToHeadRecords[newManagerRight][recordManID].manager,
                recordManID: newManagerRight,
                wins: headToHeadRecords[newManagerRight][recordManID].wins,
                ties: headToHeadRecords[newManagerRight][recordManID].ties,
                winPerc: headToHeadRecords[newManagerRight][recordManID].winPerc,
                epeWins: headToHeadRecords[newManagerRight][recordManID].epeWins,
                epeTies: headToHeadRecords[newManagerRight][recordManID].epeTies,
                epePerc: headToHeadRecords[newManagerRight][recordManID].epePerc,
                fpts: headToHeadRecords[newManagerRight][recordManID].fpts,
                fptspg: headToHeadRecords[newManagerRight][recordManID].fptspg,
                matchups: headToHeadRecords[newManagerRight][recordManID].matchups,
                specialMatchups: {
                    highScore: headToHeadRecords[newManagerRight][recordManID].highScore,
                    lowScore: headToHeadRecords[newManagerRight][recordManID].lowScore,
                    bestBlowout: headToHeadRecords[newManagerRight][recordManID].bestBlowout,
                    worstBlowout: headToHeadRecords[newManagerRight][recordManID].worstBlowout,
                    bestNailbiter: headToHeadRecords[newManagerRight][recordManID].bestNailbiter,
                    worstNailbiter: headToHeadRecords[newManagerRight][recordManID].worstNailbiter,
                },
            }

            selectedMatchup = 0;
                
            
        
            allMatchups = [];
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
        } 
    }
    $: changePlayerRecord(displayPlayerRecord);

   
    const getPositions = (managerPlayerRecords) => {
        positionsArray = [];
        for(const position in managerPlayerRecords) {
            if(position != 'managerBests' && !positionsArray.includes(position) && managerPlayerRecords[position].week_Top.length > 0) {
                positionsArray.push(position);
            }
        }
        return positionsArray;
    }
    $: getPositions(managerPlayerRecords);
    positionsArray = getPositions(managerPlayerRecords);
    
    const changePositionRecord = (positionType) => {
        displayPositionRecord = positionType;
        refreshRecords(displayPositionRecord);
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

    :global(.playerTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 2em;
        background-color: var(--gcComponent);
    }

    :global(.playerTable th) {
        background-color: var(--gcMain);
        text-align: center;
        color: var(--gcBannerText);
    }

    :global(.playerTable td) {
        background-color: var(--gcSelect);
        color: var(--gcPlayRowText);
        font-weight: 400;
    }

    :global(.playerTable thead tr) {
        background-color: var(--gcMain);
    }

    :global(.playerTable tbody tr) {
        background-color: var(--gcSelect);
    }

    :global(.playerTable table) {
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

    .buttonHolder {
        text-align: center;
        margin: 2em 0;
        width: 100%;
    }

    :global(.cellName) {
        cursor: pointer;
        line-height: 1.2em;
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

    :global(.changeYear) {
        position: relative;
        display: inline-flex;
        width: 20%;
        z-index: 1;
        font-size: 2.25em;
        cursor: pointer;
        color: #888;
        justify-content: center;
    }

    :global(.changeYear:hover) {
        color: #00316b;
    }

    .spacer {
        width: 20%;
        position: relative;
        display: inline-flex;
        margin: 0 2.5%;
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
        :global(.playerTable th) {
            font-size: 0.8em;
            padding: 1px 5px;
        }
        :global(.playerTable td) {
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
        :global(.playerTable th) {
            font-size: 0.6em;
            padding: 1px 5px;
        }
        :global(.playerTable td) {
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
        :global(.playerTable th) {
            font-size: 0.5em;
            padding: 1px 5px;
        }
        :global(.playerTable td) {
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
        position: relative;
        display: inline-flex;
        justify-content: center;
        text-align: center;
        font-size: 2.25em;
        font-weight: 450;
        color: var(--gcPlayRowText);
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

    .headToHeadHeadingText {
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

    .headToHeadSpacer {
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
            <div class="headingText" style="width: 60%;">{masterPrefix} Records</div>
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
                            <DataTable class="playerTable" style="width: 450px;">
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
                            <DataTable class="playerTable" style="width: 450px;">
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
                                <DataTable class="playerTable" style="width: 450px;">
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
                                <DataTable class="playerTable" style="width: 450px;">
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
                            <DataTable class="playerTable" style="width: 550px;">
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
                            <DataTable class="playerTable" style="width: 550px;">
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
                            <DataTable class="playerTable" style="width: 550px;">
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
                            <DataTable class="playerTable" style="width: 550px;">
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
                {#if showEmpty == false}
                    {#if displayPlayerRecord == 'week'}
                        {#if playerWeekBests && playerWeekBests.length}
                            <DataTable class="playerTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=8>
                                            <p>
                                                Top 10 Week Scores - Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header rank" style="background-color: var(--gcMain);" />
                                        <Cell class="header">Player</Cell>
                                        {#if displayPositionRecord == 'ALL'}
                                            <Cell class="header">POS</Cell>
                                        {/if}
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
                                            <Cell class="playerAvatar playerInfo" style="{playerWeekBest.avatar}; background-color: var(--gcSelect); vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                            <Cell class="left">{playerWeekBest.playerInfo.fn} {playerWeekBest.playerInfo.ln}</Cell>
                                            {#if displayPositionRecord == 'ALL'}
                                                <Cell class="center">{playerWeekBest.playerInfo.pos}</Cell>
                                            {/if}
                                            <Cell class="center">{playerWeekBest.playerInfo.pos == 'DEF' ? playerWeekBest.playerID : playerWeekBest.nflInfo.espn.t[playerWeekBest.year].length > 1 ? nflTeams.find(t => t.espnAbbreviation == playerWeekBest.nflInfo.espn.t[playerWeekBest.year].find(w => w.firstWeek <= playerWeekBest.week && w.lastWeek >= playerWeekBest.week).team).sleeperID : playerWeekBest.playerInfo.wi[playerWeekBest.year][playerWeekBest.week] && playerWeekBest.playerInfo.wi[playerWeekBest.year][playerWeekBest.week].t ? playerWeekBest.playerInfo.wi[playerWeekBest.year][playerWeekBest.week].t : nflTeams.find(t => t.espnAbbreviation == playerWeekBest.nflInfo.espn.t[playerWeekBest.year][0]).sleeperID}</Cell>
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
                            <DataTable class="playerTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=11>
                                            <p>
                                                Top 10 Season-Long Scores – Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header rank"  style="background-color: var(--gcMain);" />
                                        <Cell class="header">Player</Cell>
                                        {#if displayPositionRecord == 'ALL'}
                                            <Cell class="header">POS</Cell>
                                        {/if}
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
                                            <Cell class="playerAvatar playerInfo" style="{playerPeriodBest.avatar}; background-color: var(--gcSelect); vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                            <Cell class="left">{playerPeriodBest.playerInfo.fn} {playerPeriodBest.playerInfo.ln}</Cell>
                                            {#if displayPositionRecord == 'ALL'}
                                                <Cell class="center">{playerPeriodBest.playerInfo.pos}</Cell>
                                            {/if}
                                            <Cell class="center">{playerPeriodBest.playerInfo.pos == 'DEF' ? playerPeriodBest.playerID : playerPeriodBest.nflInfo.espn.t[playerPeriodBest.year].length == 1 ? nflTeams.find(t => t.espnAbbreviation == playerPeriodBest.nflInfo.espn.t[playerPeriodBest.year][0]).sleeperID : nflTeams.find(t => t.espnAbbreviation == playerPeriodBest.nflInfo.espn.t[playerPeriodBest.year].find(w => w.lastWeek == 100).team).sleeperID}</Cell>
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
                            <DataTable class="playerTable">
                                <Head>
                                    <Row>
                                        <Cell class="header" colspan=8>
                                            <p>
                                                Top 10 Benchwarmers – Players<br>
                                                {recordPrefix} 
                                            </p>
                                        </Cell>                  
                                    </Row>
                                    <Row>
                                        <Cell class="header rank"></Cell>
                                        <Cell class="header rank"  style="background-color: var(--gcMain);" /> 
                                        <Cell class="header">Player</Cell>
                                        {#if displayPositionRecord == 'ALL'}
                                            <Cell class="header">POS</Cell>
                                        {/if}
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
                                            <Cell class="playerAvatar playerInfo" style="{playerWeekMissedBest.avatar}; background-color: var(--gcSelect); vertical-align: middle; height: 45px; width: 45px; background-position: center; background-repeat: no-repeat; background-size: auto 45px;" />
                                            <Cell class="left">{playerWeekMissedBest.playerInfo.fn} {playerWeekMissedBest.playerInfo.ln}</Cell>
                                            {#if displayPositionRecord == 'ALL'}
                                                <Cell class="center">{playerWeekMissedBest.playerInfo.pos}</Cell>
                                            {/if}
                                            <Cell class="center">{playerWeekMissedBest.playerInfo.pos == 'DEF' ? playerWeekMissedBest.playerID : playerWeekMissedBest.nflInfo.espn.t[playerWeekMissedBest.year].length > 1 ? nflTeams.find(t => t.espnAbbreviation == playerWeekMissedBest.nflInfo.espn.t[playerWeekMissedBest.year].find(w => w.firstWeek <= playerWeekMissedBest.week && w.lastWeek >= playerWeekMissedBest.week).team).sleeperID : playerWeekMissedBest.playerInfo.wi[playerWeekMissedBest.year][playerWeekMissedBest.week] && playerWeekMissedBest.playerInfo.wi[playerWeekMissedBest.year][playerWeekMissedBest.week].t ? playerWeekMissedBest.playerInfo.wi[playerWeekMissedBest.year][playerWeekMissedBest.week].t : nflTeams.find(t => t.espnAbbreviation == playerWeekMissedBest.nflInfo.espn.t[playerWeekMissedBest.year][0]).sleeperID}</Cell>
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
                        <DataTable class="playerTable">
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
                    <div class="headToHeadWrap">
                        <div class="headToHeadChoices">
                            {#each managerChoicesLeft as manager}
                                <div class="columnWrap" style="width: 98%; align-items: flex-start;">
                                    <div class="headToHeadRow">{manager.info.realname}</div>
                                    {#if masterSelection == 'yearly'}
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
                                                {#if masterSelection == 'yearly'}
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
                                                {#if masterSelection == 'yearly'}
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
                                        <span class="headToHeadSpacer" />
                                    {/if}  
                                    <div class="headToHeadHeadingText">{displayMatchup.home.year} - Week {displayMatchup.home.week}</div>
                                    {#if selectedMatchup < allMatchups.length - 1}
                                        <Icon class="material-icons changeMatchup" on:click={() => changeMatchup(selectedMatchup + 1)}>chevron_right</Icon>
                                    {:else}
                                        <span class="headToHeadSpacer" />
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
                                    <div class="headToHeadRow" on:click={() => changeManager(manager.recordManID, headToHeadRecords)} style="justify-content: flex-end; {displayManagerRight && displayManagerRight.info.realname == manager.info.realname ? "background-color: var(--gcSelect); border: 0.1em solid var(--g111);" : null}">{manager.info.realname}</div>
                                    {#if masterSelection == 'yearly'}
                                        <div class="fantasyTeamName" style="display: inline-flex; position: relative; justify-content: flex-end; padding: 0 4%;" >({manager.info.name})</div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>     
                {:else}
                    <div class="showEmpty">{emptyMessage}</div>
                {/if}   
            </div>
        </div>
    </div>
</div>