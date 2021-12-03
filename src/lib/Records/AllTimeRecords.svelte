<script>
    import {round} from '$lib/utils/helper';
  	import RecordsAndRankings from './RecordsAndRankings.svelte'; 

    export let leagueRosterRecords, allManagers, transactionTotals, leagueWeekRecords, leagueRecordArrays, managerRecords;

    let lineupIQs = [];
    const tradesData = [];
    const waiversData = [];

    let showTies = false;
    
    for(const recordManID in transactionTotals.allTime) {
        tradesData.push({
            recordManID: transactionTotals.allTime[recordManID].recordManID,
            manager: transactionTotals.allTime[recordManID].manager,
            trades: transactionTotals.allTime[recordManID].trade,
        })
        waiversData.push({
            recordManID: transactionTotals.allTime[recordManID].recordManID,
            manager: transactionTotals.allTime[recordManID].manager,
            waivers: transactionTotals.allTime[recordManID].waiver,
        })
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
    
        if(leagueRosterRecord.ties > 0) showTies = true;
    }

    let winPercentages = leagueRecordArrays.regularSeason.managerBests.winRecords;
    lineupIQs.sort((a, b) => b.iq - a.iq);
    let fptsHistories = leagueRecordArrays.regularSeason.managerBests.cumulativePoints;
    let medianRecords = leagueRecordArrays.regularSeason.managerBests.medianRecords;
    tradesData.sort((a, b) => b.trades - a.trades);
    waiversData.sort((a, b) => b.waivers - a.waivers);


    let allTimeBiggestBlowouts = leagueRecordArrays.regularSeason.biggestBlowouts;
    let allTimeClosestMatchups = leagueRecordArrays.regularSeason.narrowestVictories;

    let playerATSeasonTOPS = leagueRecordArrays.regularSeason.players.period_Top;
    let playerATSeasonBests = leagueRecordArrays.regularSeason.players.period_Best;
    let playerATWeekBests = leagueRecordArrays.regularSeason.players.week_Best;
    let playerATWeekMissedBests = leagueRecordArrays.regularSeason.players.week_MissedBest;
    let playerATWeekTOPS = leagueRecordArrays.regularSeason.players.week_Top;
    let playerATWeekMissedTOPS = leagueRecordArrays.regularSeason.players.week_MissedTop;

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
            fptsHistories = leagueRecordArrays.regularSeason.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.regularSeason.managerBests.medianRecords;
            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.regularSeason;

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
            fptsHistories = leagueRecordArrays.playoffs.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.playoffs.managerBests.medianRecords;
            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.playoffs;

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
            fptsHistories = leagueRecordArrays.combined.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.combined.managerBests.medianRecords;
            headToHeadRecords = managerRecords.headToHeadRecords.combined.alltime;
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.alltime.combined;

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
            lineupIQs,
            weekRecords: leagueWeekRecords,
            weekLows: leagueWeekLows,
            seasonLongRecords: mostSeasonLongPoints,
            leastSeasonLongPoints,
            seasonEPERecords: allTimeEPERecords,
            seasonWorsts: allTimeSeasonWorsts,
            seasonBests: allTimeSeasonBests,
            weekBests: allTimeWeekBests,
            weekWorsts: allTimeWeekWorsts,
            playerSeasonTOPS: playerATSeasonTOPS,
            playerSeasonBests: playerATSeasonBests,
            playerWeekBests: playerATWeekBests,
            playerWeekMissedBests: playerATWeekMissedBests,
            playerWeekTOPS: playerATWeekTOPS,
            playerWeekMissedTOPS: playerATWeekMissedTOPS,
            blowouts: allTimeBiggestBlowouts,
            closestMatchups: allTimeClosestMatchups,
            winPercentages,
            fptsHistories,
            medianRecords,
            tradesData,
            waiversData,
            headToHeadRecords,
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
    prefix="All-Time"
    allTime={true}
    regular={selection == 'regular'}
    bind:selection={selection}
    bind:displayPositionRecord={displayPositionRecord}
/>
