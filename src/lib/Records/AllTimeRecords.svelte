<script>
    import {round} from '$lib/utils/helper'
  	import RecordsAndRankings from './RecordsAndRankings.svelte'; 

    export let selection, leagueRosterRecords, currentManagers, transactionTotals, leagueWeekRecords, leagueRecordArrays;

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

    let showRegular = new Boolean (true);
    let showPlayoffs = new Boolean (false);
    let showCombined = new Boolean (false);
    let displayStats;

    const changeSelection = (selection) => {
        if(selection == 'regular') {
            showRegular = true;
            showPlayoffs = false;
            showCombined = false;
        } else if(selection == 'playoffs') {
            showRegular = false;
            showPlayoffs = true;
            showCombined = false;

        } else if(selection == 'combined') {
            showRegular = false;
            showPlayoffs = false;
            showCombined = true;
        }
        displayStats = selection;
        setSelected(displayStats);
    }

    $: changeSelection(selection);

    const setSelected = (s) => {
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
            playerATSeasonTOPS = leagueRecordArrays.regularSeason.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.regularSeason.players.period_Best;
            playerATWeekBests = leagueRecordArrays.regularSeason.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.regularSeason.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.regularSeason.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.regularSeason.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.regularSeason.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.regularSeason.narrowestVictories;
            winPercentages = leagueRecordArrays.regularSeason.managerBests.winRecords;
            fptsHistories = leagueRecordArrays.regularSeason.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.regularSeason.managerBests.medianRecords;
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
            playerATSeasonTOPS = leagueRecordArrays.playoffs.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.playoffs.players.period_Best;
            playerATWeekBests = leagueRecordArrays.playoffs.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.playoffs.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.playoffs.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.playoffs.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.playoffs.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.playoffs.narrowestVictories;
            winPercentages = leagueRecordArrays.playoffs.managerBests.winRecords;
            fptsHistories = leagueRecordArrays.playoffs.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.playoffs.managerBests.medianRecords;
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
            playerATSeasonTOPS = leagueRecordArrays.combined.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.combined.players.period_Best;
            playerATWeekBests = leagueRecordArrays.combined.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.combined.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.combined.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.combined.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.combined.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.combined.narrowestVictories;
            winPercentages = leagueRecordArrays.combined.managerBests.winRecords;
            fptsHistories = leagueRecordArrays.combined.managerBests.cumulativePoints;
            medianRecords = leagueRecordArrays.combined.managerBests.medianRecords;
        }
    }

    $: setSelected(displayStats);

</script>

<RecordsAndRankings
    {currentManagers}   
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
    {lineupIQs}
    {tradesData}
    {waiversData}
    prefix="All-Time"
    allTime={true}
    regular={selection == 'regular'}
    bind:selection={selection}
/>
