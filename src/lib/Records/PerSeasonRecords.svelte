<script>
    import {round} from '$lib/utils/helper';
  	import RecordsAndRankings from './RecordsAndRankings.svelte';
    import { Icon } from '@smui/tab';

    export let leagueRosterRecords, seasonWeekRecords, allManagers, currentYear, lastYear, transactionTotals, managerRecords, playerAcquisitionRecords, playerPositionRecords;

    const yearsObj = {};
    let years = [];
    let loopYear = currentYear;
    while(loopYear >= lastYear) {
        yearsObj[loopYear] = {
            lineupIQs: [],
            year: loopYear
        }
        loopYear--;
    }

    const arraysObj = {};

    for(const seasonWeekRecord of seasonWeekRecords) {
        arraysObj[seasonWeekRecord.year] = {
            regularSeason: {},
            playoffs: {},
            combined: {},
        };
        for(const recordPeriod in seasonWeekRecord.leagueRecordArrays) {
            arraysObj[seasonWeekRecord.year][recordPeriod] = seasonWeekRecord.leagueRecordArrays[recordPeriod];
            arraysObj[seasonWeekRecord.year][recordPeriod].tradesData = [];
            arraysObj[seasonWeekRecord.year][recordPeriod].waiversData = [];
            arraysObj[seasonWeekRecord.year][recordPeriod].transactions = [];
            arraysObj[seasonWeekRecord.year][recordPeriod].players.playerPosBests = [];


            for(const position in playerPositionRecords.league.years[seasonWeekRecord.year][recordPeriod].managerBests) {
                arraysObj[seasonWeekRecord.year][recordPeriod].players.playerPosBests.push({
                    position,
                    week: playerPositionRecords.league.years[seasonWeekRecord.year][recordPeriod].managerBests[position].week_Best,
                    period: playerPositionRecords.league.years[seasonWeekRecord.year][recordPeriod].managerBests[position].period_Best,
                })
            }

            for(const recordManID in transactionTotals.seasons[seasonWeekRecord.year]) {

                let trades, waivers, outbid;
                if(recordPeriod == 'combined') {
                    trades = transactionTotals.seasons[seasonWeekRecord.year][recordManID].regularSeason.trade + transactionTotals.seasons[seasonWeekRecord.year][recordManID].playoffs.trade;
                    waivers = transactionTotals.seasons[seasonWeekRecord.year][recordManID].regularSeason.waiver + transactionTotals.seasons[seasonWeekRecord.year][recordManID].playoffs.waiver;
                    outbid = transactionTotals.seasons[seasonWeekRecord.year][recordManID].regularSeason.outbid + transactionTotals.seasons[seasonWeekRecord.year][recordManID].playoffs.outbid;
                } else {
                    trades = transactionTotals.seasons[seasonWeekRecord.year][recordManID][recordPeriod].trade;
                    waivers = transactionTotals.seasons[seasonWeekRecord.year][recordManID][recordPeriod].waiver;
                    outbid = transactionTotals.seasons[seasonWeekRecord.year][recordManID][recordPeriod].outbid;
                }
                const waiverPerc = waivers + outbid > 0 ? waivers / (waivers + outbid) * 100 : 'N/A';

                arraysObj[seasonWeekRecord.year][recordPeriod].tradesData.push({
                    recordManID: transactionTotals.seasons[seasonWeekRecord.year][recordManID].recordManID,
                    manager: transactionTotals.seasons[seasonWeekRecord.year][recordManID].manager,
                    trades,
                })
                
                arraysObj[seasonWeekRecord.year][recordPeriod].waiversData.push({
                    recordManID: transactionTotals.seasons[seasonWeekRecord.year][recordManID].recordManID,
                    manager: transactionTotals.seasons[seasonWeekRecord.year][recordManID].manager,
                    waivers,
                    outbid,
                    waiverPerc,
                })
            }
            for(const recordManID in transactionTotals.seasons[seasonWeekRecord.year]) {
                if(arraysObj[seasonWeekRecord.year][recordPeriod].waiversData?.find(w => w.recordManID == recordManID)) {
                    const waiver = arraysObj[seasonWeekRecord.year][recordPeriod].waiversData.find(w => w.recordManID == recordManID);
                    const moves = (arraysObj[seasonWeekRecord.year][recordPeriod].tradesData.find(t => t.recordManID == recordManID)?.trades || 0) + (waiver?.waivers || 0);
                    arraysObj[seasonWeekRecord.year][recordPeriod].transactions.push({
                        recordManID,
                        manager: waiver.manager,
                        moves,
                        trades: arraysObj[seasonWeekRecord.year][recordPeriod].tradesData.find(t => t.recordManID == recordManID)?.trades || 0,
                        waivers: waiver?.waivers || 0,
                        outbid: waiver?.outbid || 0,
                        waiverPerc: waiver?.waiverPerc || 'N/A',
                    })
                }
            }
            arraysObj[seasonWeekRecord.year][recordPeriod].tradesData.sort((a, b) => b.trades - a.trades);
            arraysObj[seasonWeekRecord.year][recordPeriod].waiversData.sort((a, b) => b.waivers - a.waivers);
            arraysObj[seasonWeekRecord.year][recordPeriod].transactions.sort((a, b) => b.moves - a.moves);
        }
    }

    for(const recordManID in leagueRosterRecords) {
        const leagueRosterRecord = leagueRosterRecords[recordManID];
        for(const season of leagueRosterRecord.years) {

            // add lineup IQ rankings
            const lineupIQ = {
                recordManID,
                manager: season.manager,
                fpts: round(season.fpts),
            }
            if(season.potentialPoints) {
                lineupIQ.iq = round(season.fpts / season.potentialPoints * 100);
                lineupIQ.potentialPoints = round(season.potentialPoints);
            }

            yearsObj[season.year].lineupIQs.push(lineupIQ);
        }
    }

    for(const key in yearsObj) {
        
        // sort rankings
        yearsObj[key].lineupIQs.sort((a, b) => b.iq - a.iq);

        // add to array
        years.push(yearsObj[key]);
    }

    let displayStats;
    let displayPositionRecord = 'ALL';
    let displayYear = currentYear;
    let selectedYear = currentYear;
    const changeYear = (selectedYear) => {
        displayYear = selectedYear;
    }
    $: changeYear(selectedYear);

    let displayObject = {};
    let selection = 'regular';
    const changeSelection = (selection, displayYear, newDisplayPosition) => {
        displayStats = selection;
        displayPositionRecord = newDisplayPosition;
        displayObject[selection] = {};
        let yearArrays = setSelected(displayStats, displayYear, displayPositionRecord);
        return yearArrays;
    }
    $: yearArrays = changeSelection(selection, displayYear, displayPositionRecord);

    const setSelected = (displayStats, displayYear, displayPositionRecord) => {
        let waiversData, tradesData, transactions, weekRecords, weekLows, seasonLongRecords, seasonLongLows, winPercentages, fptsHistories, medianRecords, lineupIQs, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekTOPS, playerWeekBests, playerWeekMissedBests, playerWeekMissedTOPS, playerOverallBests, playerOverallMissedBests, headToHeadRecords, leaguePlayerRecords, playerPosBests;
        
        let showTies = {
            regular: false,
            epe: false,
            median: false,
        }
        let key = displayYear;
        if(displayStats == 'regular') {
            lineupIQs = yearsObj[key].lineupIQs;
            fptsHistories = arraysObj[key].regularSeason.managerBests.cumulativePoints;
            tradesData = arraysObj[key].regularSeason.tradesData;
            waiversData = arraysObj[key].regularSeason.waiversData;
            transactions = arraysObj[key].regularSeason.transactions;

            weekRecords = arraysObj[key].regularSeason.week_Top;
            weekLows = arraysObj[key].regularSeason.week_Low;
            seasonLongRecords = arraysObj[key].regularSeason.period_Top;
            seasonLongLows = arraysObj[key].regularSeason.period_Low;
            blowouts = arraysObj[key].regularSeason.biggestBlowouts;
            closestMatchups = arraysObj[key].regularSeason.narrowestVictories;

            weekBests = arraysObj[key].regularSeason.managerBests.week_Best;
            weekWorsts = arraysObj[key].regularSeason.managerBests.week_Worst;
            seasonBests = arraysObj[key].regularSeason.managerBests.period_Best;
            seasonWorsts = arraysObj[key].regularSeason.managerBests.period_Worst;
            fptsHistories = arraysObj[key].regularSeason.managerBests.cumulativePoints;

            seasonEPERecords = arraysObj[key].regularSeason.managerBests.epeRecords;
            for(const record of seasonEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }
            winPercentages = arraysObj[key].regularSeason.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            medianRecords = arraysObj[key].regularSeason.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }

            playerSeasonBests = arraysObj[key].regularSeason.players.period_Best;
            playerWeekBests = arraysObj[key].regularSeason.players.week_Best;
            playerWeekMissedBests = arraysObj[key].regularSeason.players.week_MissedBest;
            playerOverallBests = arraysObj[key].regularSeason.players.overall_Best;
            playerOverallMissedBests = arraysObj[key].regularSeason.players.overall_MissedBest;
            playerPosBests = arraysObj[key].regularSeason.players.playerPosBests;

            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.years[key]; 
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].regularSeason;

            playerWeekTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].regularSeason.players.week_Top : managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].week_Top;
            playerSeasonTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].regularSeason.players.period_Top : managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].period_Top;
            playerWeekMissedTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].regularSeason.players.week_MissedTop : managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].week_MissedTop;
            
        } else if(displayStats == 'playoffs') {
            lineupIQs = yearsObj[key].lineupIQs;
            fptsHistories = arraysObj[key].playoffs.managerBests.cumulativePoints;
            tradesData = arraysObj[key].playoffs.tradesData;
            waiversData = arraysObj[key].playoffs.waiversData;
            transactions = arraysObj[key].playoffs.transactions;

            weekRecords = arraysObj[key].playoffs.week_Top;
            weekLows = arraysObj[key].playoffs.week_Low;
            seasonLongRecords = arraysObj[key].playoffs.period_Top;
            seasonLongLows = arraysObj[key].playoffs.period_Low;
            blowouts = arraysObj[key].playoffs.biggestBlowouts;
            closestMatchups = arraysObj[key].playoffs.narrowestVictories;

            weekBests = arraysObj[key].playoffs.managerBests.week_Best;
            weekWorsts = arraysObj[key].playoffs.managerBests.week_Worst;
            seasonBests = arraysObj[key].playoffs.managerBests.period_Best;
            seasonWorsts = arraysObj[key].playoffs.managerBests.period_Worst;
            fptsHistories = arraysObj[key].playoffs.managerBests.cumulativePoints;

            winPercentages = arraysObj[key].playoffs.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            seasonEPERecords = arraysObj[key].playoffs.managerBests.epeRecords;
            for(const record of seasonEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }
            medianRecords = arraysObj[key].playoffs.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }

            playerSeasonBests = arraysObj[key].playoffs.players.period_Best;
            playerWeekBests = arraysObj[key].playoffs.players.week_Best;
            playerWeekMissedBests = arraysObj[key].playoffs.players.week_MissedBest;
            playerOverallBests = arraysObj[key].playoffs.players.overall_Best;
            playerOverallMissedBests = arraysObj[key].playoffs.players.overall_MissedBest;
            playerPosBests = arraysObj[key].playoffs.players.playerPosBests;

            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.years[key];
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].playoffs;
            playerWeekTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].playoffs.players.week_Top : managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].week_Top;
            playerSeasonTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].playoffs.players.period_Top : managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].period_Top;
            playerWeekMissedTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].playoffs.players.week_MissedTop : managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].week_MissedTop;

        } else if(displayStats == 'combined') {

            lineupIQs = yearsObj[key].lineupIQs;
            fptsHistories = arraysObj[key].combined.managerBests.cumulativePoints;
            tradesData = arraysObj[key].combined.tradesData;
            waiversData = arraysObj[key].combined.waiversData;
            transactions = arraysObj[key].combined.transactions;

            weekRecords = arraysObj[key].combined.week_Top;
            weekLows = arraysObj[key].combined.week_Low;
            seasonLongRecords = arraysObj[key].combined.period_Top;
            seasonLongLows = arraysObj[key].combined.period_Low;
            blowouts = arraysObj[key].combined.biggestBlowouts;
            closestMatchups = arraysObj[key].combined.narrowestVictories;

            weekBests = arraysObj[key].combined.managerBests.week_Best;
            weekWorsts = arraysObj[key].combined.managerBests.week_Worst;
            seasonBests = arraysObj[key].combined.managerBests.period_Best;
            seasonWorsts = arraysObj[key].combined.managerBests.period_Worst;
            fptsHistories = arraysObj[key].combined.managerBests.cumulativePoints;

            winPercentages = arraysObj[key].combined.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            medianRecords = arraysObj[key].combined.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }
            seasonEPERecords = arraysObj[key].combined.managerBests.epeRecords;
            for(const record of seasonEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }

            playerSeasonBests = arraysObj[key].combined.players.period_Best;
            playerWeekBests = arraysObj[key].combined.players.week_Best;
            playerWeekMissedBests = arraysObj[key].combined.players.week_MissedBest;
            playerOverallBests = arraysObj[key].combined.players.overall_Best;
            playerOverallMissedBests = arraysObj[key].combined.players.overall_MissedBest;
            playerPosBests = arraysObj[key].combined.players.playerPosBests;

            headToHeadRecords = managerRecords.headToHeadRecords.combined.years[key];
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].combined;
            playerWeekTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].combined.players.week_Top : managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].week_Top;
            playerSeasonTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].combined.players.period_Top : managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].period_Top;
            playerWeekMissedTOPS = displayPositionRecord == 'ALL' ? arraysObj[key].combined.players.week_MissedTop : managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].week_MissedTop;
        }

        displayObject[displayStats] = {
            lineupIQs: {
                stats: lineupIQs,
                sort: 'iq',
                inverted: false,
            },
            weekRecords: {
                stats: weekRecords,
                sort: 'fpts',
                inverted: false,
            },
            weekLows: {
                stats: weekLows,
                sort: 'fpts',
                inverted: false,
            },
            seasonLongRecords: {
                stats: seasonLongRecords,
                sort: 'fptpg',
                inverted: false,
            },
            seasonLongLows: {
                stats: seasonLongLows,
                sort: 'fptspg',
                inverted: false,
            },
            seasonEPERecords: {
                stats: seasonEPERecords,
                sort: 'epePerc',
                inverted: false,
            },
            seasonWorsts: {
                stats: seasonWorsts,
                sort: 'fptspg',
                inverted: false,
            },
            seasonBests: {
                stats: seasonBests,
                sort: 'fptspg',
                inverted: false,
            },
            weekBests: {
                stats: weekBests,
                sort: 'fpts',
                inverted: false,
            },
            weekWorsts: {
                stats: weekWorsts,
                sort: 'fpts',
                inverted: false,
            },
            playerSeasonTOPS: {
                stats: playerSeasonTOPS,
                sort: 'playerPoints',
                inverted: false,
            },
            playerSeasonBests: {
                stats: playerSeasonBests,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekBests: {
                stats: playerWeekBests,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekMissedBests: {
                stats: playerWeekMissedBests,
                sort: 'benchPoints',
                inverted: false,
            },
            playerWeekTOPS: {
                stats: playerWeekTOPS,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekMissedTOPS: {
                stats: playerWeekMissedTOPS,
                sort: 'benchPoints',
                inverted: false,
            },
            playerOverallBests: {
                stats: playerOverallBests,
                sort: 'totalFpts',
                inverted: false,
            },
            playerOverallMissedBests: {
                stats: playerOverallMissedBests,
                sort: 'benchPoints',
                inverted: false,
            },
            blowouts: {
                stats: blowouts,
                sort: 'matchDifferential',
                inverted: false,
            },
            closestMatchups: {
                stats: closestMatchups,
                sort: 'matchDifferential',
                inverted: false,
            },
            winPercentages: {
                stats: winPercentages,
                sort: 'winPerc',
                inverted: false,
            },
            fptsHistories: {
                stats: fptsHistories,
                sort: 'fptspg',
                inverted: false,
            },
            medianRecords: {
                stats: medianRecords,
                sort: 'medianPerc',
                inverted: false,
            },
            tradesData: {
                stats: tradesData,
                sort: 'trades',
                inverted: false,
            },
            waiversData: {
                stats: waiversData,
                sort: 'waivers',
                inverted: false,
            },
            transactions: {
                stats: transactions,
                sort: 'moves',
                inverted: false,
            },
            headToHeadRecords,
        }

        for(const position of playerPosBests) {
            displayObject[displayStats][`weekBest_${position.position}`] = {
                stats: position.week,
                sort: 'playerPoints',
                inverted: false,
            }
            displayObject[displayStats][`periodBest_${position.position}`] = {
                stats: position.period,
                sort: 'playerPoints',
                inverted: false,
            }
        }

        return {waiversData, tradesData, transactions, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, medianRecords, lineupIQs, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekTOPS, playerWeekBests, playerWeekMissedBests, playerWeekMissedTOPS, playerOverallBests, playerOverallMissedBests, headToHeadRecords, leaguePlayerRecords, playerPosBests};
    }

</script>

<style>
    .yearContainer {
        display: inline-flex;
        position: relative;
        width: 100%;
        height: 7em;
        align-items: center;
        justify-content: space-evenly;
        background-color: var(--gcBox);
        box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    .yearText {
        position: relative;
        display: inline-flex;
        text-align: center;
        justify-content: center;
        font-size: 2.25em;
        font-weight: 450;
        width: 60%;
        color: var(--gcPlayRowText);
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

</style>

<div class="yearContainer">
    {#if displayYear > lastYear}
        <Icon class="material-icons changeYear" on:click={() => changeYear(displayYear - 1)}>chevron_left</Icon>
    {:else}
        <span class="spacer" />
    {/if}  

    <div class="yearText">{displayYear} Records</div>

    {#if displayYear < currentYear}
        <Icon class="material-icons changeYear" on:click={() => changeYear(displayYear + 1)}>chevron_right</Icon>
    {:else}
        <span class="spacer" />
    {/if}  
</div>

    <RecordsAndRankings
        {displayObject}
        waiversData = {yearArrays.waiversData}
        tradesData = {yearArrays.tradesData}
        transactions = {yearArrays.transactions}
        weekRecords = {yearArrays.weekRecords}
	    weekLows = {yearArrays.weekLows}
        seasonLongRecords = {yearArrays.seasonLongRecords}
	    seasonLongLows = {yearArrays.seasonLongLows}
        showTies = {yearArrays.showTies}
        winPercentages = {yearArrays.winPercentages}
        fptsHistories = {yearArrays.fptsHistories}
        medianRecords = {yearArrays.medianRecords}
        lineupIQs = {yearArrays.lineupIQs}
        blowouts = {yearArrays.blowouts}
        closestMatchups = {yearArrays.closestMatchups}
        weekBests = {yearArrays.weekBests}
        weekWorsts = {yearArrays.weekWorsts}
        seasonBests = {yearArrays.seasonBests}
        seasonWorsts = {yearArrays.seasonWorsts}
        seasonEPERecords = {yearArrays.seasonEPERecords}
        playerSeasonTOPS = {yearArrays.playerSeasonTOPS}
        playerSeasonBests = {yearArrays.playerSeasonBests}
        playerWeekTOPS = {yearArrays.playerWeekTOPS}
        playerWeekBests = {yearArrays.playerWeekBests}
        playerWeekMissedBests = {yearArrays.playerWeekMissedBests}
        playerWeekMissedTOPS = {yearArrays.playerWeekMissedTOPS}
        playerOverallBests = {yearArrays.playerOverallBests}
        playerOverallMissedBests = {yearArrays.playerOverallMissedBests}
        headToHeadRecords = {yearArrays.headToHeadRecords}
        leaguePlayerRecords = {yearArrays.leaguePlayerRecords}
        playerPosBests = {yearArrays.playerPosBests}
        prefix={displayYear}
        {allManagers}
        regular={selection == 'regular'}
        bind:selection={selection}
        bind:displayYear={displayYear}
        bind:displayPositionRecord={displayPositionRecord}
    />
