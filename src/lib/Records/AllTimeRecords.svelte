<script>
    import {round} from '$lib/utils/helper';
  	import RecordsAndRankings from './RecordsAndRankings.svelte'; 

    export let leagueRosterRecords, allManagers, transactionTotals, leagueWeekRecords, leagueRecordArrays, managerRecords, playerAcquisitionRecords, playerPositionRecords;

    const recordPeriods = [
        'regularSeason',
        'playoffs',
        'combined',
    ]
    let lineupIQs = [];
    let tradesArrays = {};
    let waiversArrays = {};
    let transArrays = {};
    let playerPosArrays = {};
    for(const recordPeriod of recordPeriods) {
        playerPosArrays[recordPeriod] = [];
        
        for(const position in playerPositionRecords.league.alltime[recordPeriod].managerBests) {
            playerPosArrays[recordPeriod].push({
                position,
                week: playerPositionRecords.league.alltime[recordPeriod].managerBests[position].week_Best,
                period: playerPositionRecords.league.alltime[recordPeriod].managerBests[position].period_Best,
            })
        }
    }
    
    for(const recordManID in transactionTotals.allTime) {

        for(const recordPeriod of recordPeriods) {

            if(!tradesArrays[recordPeriod]) tradesArrays[recordPeriod] = [];
            if(!waiversArrays[recordPeriod]) waiversArrays[recordPeriod] = [];
            if(!transArrays[recordPeriod]) transArrays[recordPeriod] = [];

            let trades, waivers, outbid;
            if(recordPeriod == 'combined') {
                trades = transactionTotals.allTime[recordManID].regularSeason.trade + transactionTotals.allTime[recordManID].playoffs.trade;
                waivers = transactionTotals.allTime[recordManID].regularSeason.waiver + transactionTotals.allTime[recordManID].playoffs.waiver;
                outbid = transactionTotals.allTime[recordManID].regularSeason.outbid + transactionTotals.allTime[recordManID].playoffs.outbid;
            } else {
                trades = transactionTotals.allTime[recordManID][recordPeriod].trade;
                waivers = transactionTotals.allTime[recordManID][recordPeriod].waiver;
                outbid = transactionTotals.allTime[recordManID][recordPeriod].outbid;
            }
            const waiverPerc = waivers + outbid > 0 ? waivers / (waivers + outbid) * 100 : 'N/A';

            tradesArrays[recordPeriod].push({
                recordManID: transactionTotals.allTime[recordManID].recordManID,
                manager: transactionTotals.allTime[recordManID].manager,
                trades,
            })

            waiversArrays[recordPeriod].push({
                recordManID: transactionTotals.allTime[recordManID].recordManID,
                manager: transactionTotals.allTime[recordManID].manager,
                waivers,
                outbid,
                waiverPerc,
            })
        }
    }

    for(const recordManID in transactionTotals.allTime) {
        for(const recordPeriod in tradesArrays) {
            if(waiversArrays[recordPeriod].find(w => w.recordManID == recordManID)) {
                const waiver = waiversArrays[recordPeriod].find(w => w.recordManID == recordManID);
                const moves = (tradesArrays[recordPeriod].find(t => t.recordManID == recordManID)?.trades || 0) + (waiver?.waivers || 0);
                transArrays[recordPeriod].push({
                    recordManID,
                    manager: waiver.manager,
                    moves,
                    trades: tradesArrays[recordPeriod].find(t => t.recordManID == recordManID)?.trades || 0,
                    waivers: waiver?.waivers || 0,
                    outbid: waiver?.outbid || 0,
                    waiverPerc: waiver?.waiverPerc || 'N/A',
                })
            }
        }
    }

    for(const recordPeriod in tradesArrays) {
        tradesArrays[recordPeriod].sort((a, b) => b.trades - a.trades);
        waiversArrays[recordPeriod].sort((a, b) => b.waivers - a.waivers);
        transArrays[recordPeriod].sort((a, b) => b.moves - a.moves);
    }

    for(const key in leagueRosterRecords) {
        const leagueRosterRecord = leagueRosterRecords[key];

        let lineupIQ = {
            recordManID: key,
            manager: leagueRosterRecord.manager,
            fpts: round(leagueRosterRecord.fptsFor),
        }

        if(leagueRosterRecord.potentialPoints) {
            lineupIQ.iq = round(leagueRosterRecord.fptsFor / leagueRosterRecord.potentialPoints * 100);
            lineupIQ.potentialPoints = round(leagueRosterRecord.potentialPoints);
        }

        lineupIQs.push(lineupIQ)
    
    }

    let showTies = {
        regular: false,
        epe: false,
        median: false,
    }

    let winPercentages = leagueRecordArrays.regularSeason.managerBests.winRecords;
    lineupIQs.sort((a, b) => b.iq - a.iq);
    let fptsHistories = leagueRecordArrays.regularSeason.managerBests.cumulativePoints;
    let medianRecords = leagueRecordArrays.regularSeason.managerBests.medianRecords;
    let tradesData = tradesArrays.regularSeason;
    let waiversData = waiversArrays.regularSeason;
    let transactions = transArrays.regularSeason;

    let allTimeBiggestBlowouts = leagueRecordArrays.regularSeason.biggestBlowouts;
    let allTimeClosestMatchups = leagueRecordArrays.regularSeason.narrowestVictories;

    let playerATSeasonTOPS = leagueRecordArrays.regularSeason.players.period_Top;
    let playerATSeasonBests = leagueRecordArrays.regularSeason.players.period_Best;
    let playerATWeekBests = leagueRecordArrays.regularSeason.players.week_Best;
    let playerATWeekMissedBests = leagueRecordArrays.regularSeason.players.week_MissedBest;
    let playerATWeekTOPS = leagueRecordArrays.regularSeason.players.week_Top;
    let playerATWeekMissedTOPS = leagueRecordArrays.regularSeason.players.week_MissedTop;
    let playerOverallBests = leagueRecordArrays.regularSeason.players.overall_Best;
    let playerOverallMissedBests = leagueRecordArrays.regularSeason.players.overall_MissedBest;
    let playerPosBests = playerPosArrays.regularSeason;

    let leagueWeekLows = leagueRecordArrays.regularSeason.week_Low;
    let mostSeasonLongPoints = leagueRecordArrays.regularSeason.period_Top;
    let leastSeasonLongPoints = leagueRecordArrays.regularSeason.period_Low;
    let allTimeEPERecords = leagueRecordArrays.regularSeason.managerBests.epeRecords;
    let allTimeSeasonWorsts = leagueRecordArrays.regularSeason.managerBests.period_Worst;
    let allTimeSeasonBests = leagueRecordArrays.regularSeason.managerBests.period_Best;
    let allTimeWeekBests = leagueRecordArrays.regularSeason.managerBests.week_Best;
    let allTimeWeekWorsts = leagueRecordArrays.regularSeason.managerBests.week_Worst;

    let headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.alltime;
    let leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.regularSeason;

    let displayStats;
    let selection = 'regular';
    let displayPositionRecord = 'ALL';
    let displayObject = {};
    const changeSelection = (selection, newDisplayPosition) => {
        displayPositionRecord = newDisplayPosition;
        displayStats = selection;
        displayObject[selection] = {};
        showTies.regular = false;
        showTies.epe = false;
        showTies.median = false;
        setSelected(displayStats, displayPositionRecord);
    }

    $: changeSelection(selection, displayPositionRecord);

    const setSelected = (displayStats, displayPositionRecord) => {        
        if(displayStats == 'regular') {
            leagueWeekRecords = leagueRecordArrays.regularSeason.week_Top;
            leagueWeekLows = leagueRecordArrays.regularSeason.week_Low;
            mostSeasonLongPoints = leagueRecordArrays.regularSeason.period_Top;
            leastSeasonLongPoints = leagueRecordArrays.regularSeason.period_Low;
            allTimeEPERecords = leagueRecordArrays.regularSeason.managerBests.epeRecords;
            for(const record of allTimeEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }
            allTimeSeasonWorsts = leagueRecordArrays.regularSeason.managerBests.period_Worst;
            allTimeSeasonBests = leagueRecordArrays.regularSeason.managerBests.period_Best;
            allTimeWeekBests = leagueRecordArrays.regularSeason.managerBests.week_Best;
            allTimeWeekWorsts = leagueRecordArrays.regularSeason.managerBests.week_Worst;
            playerATSeasonBests = leagueRecordArrays.regularSeason.players.period_Best;
            playerATWeekBests = leagueRecordArrays.regularSeason.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.regularSeason.players.week_MissedBest;
            allTimeBiggestBlowouts = leagueRecordArrays.regularSeason.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.regularSeason.narrowestVictories;
            winPercentages = leagueRecordArrays.regularSeason.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            fptsHistories = leagueRecordArrays.regularSeason.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.regularSeason.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }
            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.regularSeason;
            playerOverallBests = leagueRecordArrays.regularSeason.players.overall_Best;
            playerOverallMissedBests = leagueRecordArrays.regularSeason.players.overall_MissedBest;
            playerPosBests = playerPosArrays.regularSeason;
            tradesData = tradesArrays.regularSeason;
            waiversData = waiversArrays.regularSeason;
            transactions = transArrays.regularSeason;

            if(displayPositionRecord == 'ALL') {
                playerATWeekTOPS = leagueRecordArrays.regularSeason.players.week_Top;
                playerATSeasonTOPS = leagueRecordArrays.regularSeason.players.period_Top;
                playerATWeekMissedTOPS = leagueRecordArrays.regularSeason.players.week_MissedTop;
            } else {
                playerATWeekTOPS = managerRecords.leaguePlayerRecords.alltime.regularSeason[displayPositionRecord].week_Top;
                playerATSeasonTOPS = managerRecords.leaguePlayerRecords.alltime.regularSeason[displayPositionRecord].period_Top;
                playerATWeekMissedTOPS = managerRecords.leaguePlayerRecords.alltime.regularSeason[displayPositionRecord].week_MissedTop;
            }
        } else if(displayStats == 'playoffs') {
            leagueWeekRecords = leagueRecordArrays.playoffs.week_Top;
            leagueWeekLows = leagueRecordArrays.playoffs.week_Low;
            mostSeasonLongPoints = leagueRecordArrays.playoffs.period_Top;
            leastSeasonLongPoints = leagueRecordArrays.playoffs.period_Low;
            allTimeEPERecords = leagueRecordArrays.playoffs.managerBests.epeRecords;
            for(const record of allTimeEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }
            allTimeSeasonWorsts = leagueRecordArrays.playoffs.managerBests.period_Worst;
            allTimeSeasonBests = leagueRecordArrays.playoffs.managerBests.period_Best;
            allTimeWeekBests = leagueRecordArrays.playoffs.managerBests.week_Best;
            allTimeWeekWorsts = leagueRecordArrays.playoffs.managerBests.week_Worst;
            playerATSeasonBests = leagueRecordArrays.playoffs.players.period_Best;
            playerATWeekBests = leagueRecordArrays.playoffs.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.playoffs.players.week_MissedBest;
            allTimeBiggestBlowouts = leagueRecordArrays.playoffs.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.playoffs.narrowestVictories;
            winPercentages = leagueRecordArrays.playoffs.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            fptsHistories = leagueRecordArrays.playoffs.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.playoffs.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }
            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.playoffs;
            playerOverallBests = leagueRecordArrays.playoffs.players.overall_Best;
            playerOverallMissedBests = leagueRecordArrays.playoffs.players.overall_MissedBest;
            playerPosBests = playerPosArrays.playoffs;
            tradesData = tradesArrays.playoffs;
            waiversData = waiversArrays.playoffs;
            transactions = transArrays.playoffs;

            if(displayPositionRecord == 'ALL') {
                playerATWeekTOPS = leagueRecordArrays.playoffs.players.week_Top;
                playerATSeasonTOPS = leagueRecordArrays.playoffs.players.period_Top;
                playerATWeekMissedTOPS = leagueRecordArrays.playoffs.players.week_MissedTop;
            } else {
                playerATWeekTOPS = managerRecords.leaguePlayerRecords.alltime.playoffs[displayPositionRecord].week_Top;
                playerATSeasonTOPS = managerRecords.leaguePlayerRecords.alltime.playoffs[displayPositionRecord].period_Top;
                playerATWeekMissedTOPS = managerRecords.leaguePlayerRecords.alltime.playoffs[displayPositionRecord].week_MissedTop;
            }
        } else if(displayStats == 'combined') {
            leagueWeekRecords = leagueRecordArrays.combined.week_Top;
            leagueWeekLows = leagueRecordArrays.combined.week_Low; 
            mostSeasonLongPoints = leagueRecordArrays.combined.period_Top;  
            leastSeasonLongPoints = leagueRecordArrays.combined.period_Low; 
            allTimeEPERecords = leagueRecordArrays.combined.managerBests.epeRecords;  
            for(const record of allTimeEPERecords) {
                if(record.epeTies > 0 && showTies.epe == false) {
                    showTies.epe = true;
                }
            }
            allTimeSeasonWorsts = leagueRecordArrays.combined.managerBests.period_Worst; 
            allTimeSeasonBests = leagueRecordArrays.combined.managerBests.period_Best; 
            allTimeWeekBests = leagueRecordArrays.combined.managerBests.week_Best;
            allTimeWeekWorsts = leagueRecordArrays.combined.managerBests.week_Worst;
            playerATSeasonBests = leagueRecordArrays.combined.players.period_Best;
            playerATWeekBests = leagueRecordArrays.combined.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.combined.players.week_MissedBest;
            allTimeBiggestBlowouts = leagueRecordArrays.combined.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.combined.narrowestVictories;
            winPercentages = leagueRecordArrays.combined.managerBests.winRecords;
            for(const record of winPercentages) {
                if(record.ties > 0 && showTies.regular == false) {
                    showTies.regular = true;
                }
            }
            fptsHistories = leagueRecordArrays.combined.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.combined.managerBests.medianRecords;
            for(const record of medianRecords) {
                if(record.weekTies > 0 && showTies.median == false) {
                    showTies.median = true;
                }
            }
            headToHeadRecords = managerRecords.headToHeadRecords.combined.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.combined;
            playerOverallBests = leagueRecordArrays.combined.players.overall_Best;
            playerOverallMissedBests = leagueRecordArrays.combined.players.overall_MissedBest;
            playerPosBests = playerPosArrays.combined;
            tradesData = tradesArrays.combined;
            waiversData = waiversArrays.combined;
            transactions = transArrays.combined;

            if(displayPositionRecord == 'ALL') {
                playerATWeekTOPS = leagueRecordArrays.combined.players.week_Top;
                playerATSeasonTOPS = leagueRecordArrays.combined.players.period_Top;
                playerATWeekMissedTOPS = leagueRecordArrays.combined.players.week_MissedTop;
            } else {
                playerATWeekTOPS = managerRecords.leaguePlayerRecords.alltime.combined[displayPositionRecord].week_Top;
                playerATSeasonTOPS = managerRecords.leaguePlayerRecords.alltime.combined[displayPositionRecord].period_Top;
                playerATWeekMissedTOPS = managerRecords.leaguePlayerRecords.alltime.combined[displayPositionRecord].week_MissedTop;
            }
        }
        displayObject[displayStats] = {
            lineupIQs: {
                stats: lineupIQs,
                sort: 'iq',
                inverted: false,
            },
            weekRecords: {
                stats: leagueWeekRecords,
                sort: 'fpts',
                inverted: false,
            },
            weekLows: {
                stats: leagueWeekLows,
                sort: 'fpts',
                inverted: false,
            },
            seasonLongRecords: {
                stats: mostSeasonLongPoints,
                sort: 'fptpg',
                inverted: false,
            },
            leastSeasonLongPoints: {
                stats: leastSeasonLongPoints,
                sort: 'fptspg',
                inverted: false,
            },
            seasonEPERecords: {
                stats: allTimeEPERecords,
                sort: 'epePerc',
                inverted: false,
            },
            seasonWorsts: {
                stats: allTimeSeasonWorsts,
                sort: 'fptspg',
                inverted: false,
            },
            seasonBests: {
                stats: allTimeSeasonBests,
                sort: 'fptspg',
                inverted: false,
            },
            weekBests: {
                stats: allTimeWeekBests,
                sort: 'fpts',
                inverted: false,
            },
            weekWorsts: {
                stats: allTimeWeekWorsts,
                sort: 'fpts',
                inverted: false,
            },
            playerSeasonTOPS: {
                stats: playerATSeasonTOPS,
                sort: 'playerPoints',
                inverted: false,
            },
            playerSeasonBests: {
                stats: playerATSeasonBests,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekBests: {
                stats: playerATWeekBests,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekMissedBests: {
                stats: playerATWeekMissedBests,
                sort: 'benchPoints',
                inverted: false,
            },
            playerWeekTOPS: {
                stats: playerATWeekTOPS,
                sort: 'playerPoints',
                inverted: false,
            },
            playerWeekMissedTOPS: {
                stats: playerATWeekMissedTOPS,
                sort: 'benchPoints',
                inverted: false,
            },
            blowouts: {
                stats: allTimeBiggestBlowouts,
                sort: 'matchDifferential',
                inverted: false,
            },
            closestMatchups: {
                stats: allTimeClosestMatchups,
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
            playerOverallBests: {
                stats: playerOverallBests,
                sort: 'playerPoints',
                inverted: false,
            },
            playerOverallMissedBests: {
                stats: playerOverallMissedBests,
                sort: 'benchPoints',
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
    }

    $: setSelected(displayStats, displayPositionRecord);

</script>

<style>
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

<div class="headingContainer">
    <div class="headingText">All-Time Records</div>
</div>


<RecordsAndRankings
    {displayObject}
    {allManagers}   
    blowouts={allTimeBiggestBlowouts}
    closestMatchups={allTimeClosestMatchups}
    weekBests={allTimeWeekBests}
    weekWorsts={allTimeWeekWorsts}
    seasonBests={allTimeSeasonBests} 
    seasonWorsts={allTimeSeasonWorsts}
    weekRecords={leagueWeekRecords}
    weekLows={leagueWeekLows}
    seasonEPERecords={allTimeEPERecords}
    seasonLongRecords={mostSeasonLongPoints}
    playerSeasonTOPS={playerATSeasonTOPS}
    playerSeasonBests={playerATSeasonBests}
    playerWeekTOPS={playerATWeekTOPS}
    playerWeekBests={playerATWeekBests}
    playerWeekMissedBests={playerATWeekMissedBests}
    playerWeekMissedTOPS={playerATWeekMissedTOPS}
    {playerOverallBests}
    {playerOverallMissedBests}
    {playerPosBests}
    {leastSeasonLongPoints}  
    {showTies}
    {winPercentages}
    {fptsHistories}
    {medianRecords}
    {headToHeadRecords}
    {leaguePlayerRecords}
    {lineupIQs}
    {tradesData}
    {waiversData}
    {transactions}
    prefix="All-Time"
    allTime={true}
    regular={selection == 'regular'}
    bind:selection={selection}
    bind:displayPositionRecord={displayPositionRecord}
/>
