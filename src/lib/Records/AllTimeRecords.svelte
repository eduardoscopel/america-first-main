<script>
    import {round} from '$lib/utils/helper'
  	import RecordsAndRankings from './RecordsAndRankings.svelte'; 

    export let selection, leagueRosterRecords, leagueWeekRecords, leagueWeekLows, allTimeEPERecords, allTimeBiggestBlowouts, allTimeClosestMatchups, allTimeWeekBests, allTimeWeekWorsts, allTimeSeasonBests, allTimeSeasonWorsts, currentManagers, mostSeasonLongPoints, leastSeasonLongPoints, transactionTotals, playerATSeasonTOPS, playerATSeasonBests, playerATWeekTOPS, playerATWeekBests, playerATWeekMissedBests, playerATWeekMissedTOPS, leagueRecordArrays;

    let winPercentages = [];
    let lineupIQs = [];
    const fptsHistories = [];
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
        winPercentages.push({
            recordManID: key,
            manager: leagueRosterRecord.manager,
            percentage: round((leagueRosterRecord.wins + leagueRosterRecord.ties / 2) / (leagueRosterRecord.wins + leagueRosterRecord.ties + leagueRosterRecord.losses) * 100),
            wins: leagueRosterRecord.wins,
            ties: leagueRosterRecord.ties,
            losses: leagueRosterRecord.losses,
        })

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
    
        fptsHistories.push({
            recordManID: key,
            manager: leagueRosterRecord.manager,
            fptsFor: round(leagueRosterRecord.fptsFor),
            fptsAgainst: round(leagueRosterRecord.fptsAgainst),
            fptsPerGame: round(leagueRosterRecord.fptsFor / (leagueRosterRecord.wins + leagueRosterRecord.losses + leagueRosterRecord.ties)),
        })
    
        if(leagueRosterRecord.ties > 0) showTies = true;
    }

    winPercentages.sort((a, b) => b.percentage - a.percentage);
    lineupIQs.sort((a, b) => b.iq - a.iq);
    fptsHistories.sort((a, b) => b.fptsFor - a.fptsFor);
    tradesData.sort((a, b) => b.trades - a.trades);
    waiversData.sort((a, b) => b.waivers - a.waivers);

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
            allTimeWeekBests = leagueRecordArrays.regularSeason.managerBests.week_Worst;
            allTimeWeekWorsts = leagueRecordArrays.regularSeason.managerBests.week_Best;
            playerATSeasonTOPS = leagueRecordArrays.regularSeason.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.regularSeason.players.period_Best;
            playerATWeekBests = leagueRecordArrays.regularSeason.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.regularSeason.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.regularSeason.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.regularSeason.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.regularSeason.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.regularSeason.narrowestVictories;
        } else if(displayStats == 'playoffs') {
            leagueWeekRecords = leagueRecordArrays.playoffs.week_Top;
            leagueWeekLows = leagueRecordArrays.playoffs.week_Low;
            mostSeasonLongPoints = leagueRecordArrays.playoffs.period_Top;
            leastSeasonLongPoints = leagueRecordArrays.playoffs.period_Low;
            allTimeEPERecords = leagueRecordArrays.playoffs.managerBests.epeRecords;
            allTimeSeasonWorsts = leagueRecordArrays.playoffs.managerBests.period_Worst;
            allTimeSeasonBests = leagueRecordArrays.playoffs.managerBests.period_Best;
            allTimeWeekBests = leagueRecordArrays.playoffs.managerBests.week_Worst;
            allTimeWeekWorsts = leagueRecordArrays.playoffs.managerBests.week_Best;
            playerATSeasonTOPS = leagueRecordArrays.playoffs.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.playoffs.players.period_Best;
            playerATWeekBests = leagueRecordArrays.playoffs.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.playoffs.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.playoffs.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.playoffs.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.playoffs.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.playoffs.narrowestVictories;
        } else if(displayStats == 'combined') {
            leagueWeekRecords = leagueRecordArrays.combined.week_Top;
            leagueWeekLows = leagueRecordArrays.combined.week_Low; 
            mostSeasonLongPoints = leagueRecordArrays.combined.period_Top;  
            leastSeasonLongPoints = leagueRecordArrays.combined.period_Low; 
            allTimeEPERecords = leagueRecordArrays.combined.managerBests.epeRecords;  
            allTimeSeasonWorsts = leagueRecordArrays.combined.managerBests.period_Worst; 
            allTimeSeasonBests = leagueRecordArrays.combined.managerBests.period_Best; 
            allTimeWeekBests = leagueRecordArrays.combined.managerBests.week_Worst;
            allTimeWeekWorsts = leagueRecordArrays.combined.managerBests.week_Best;
            playerATSeasonTOPS = leagueRecordArrays.combined.players.period_Top;
            playerATSeasonBests = leagueRecordArrays.combined.players.period_Best;
            playerATWeekBests = leagueRecordArrays.combined.players.week_Best;
            playerATWeekMissedBests = leagueRecordArrays.combined.players.week_MissedBest;
            playerATWeekTOPS = leagueRecordArrays.combined.players.week_Top;
            playerATWeekMissedTOPS = leagueRecordArrays.combined.players.week_MissedTop;
            allTimeBiggestBlowouts = leagueRecordArrays.combined.biggestBlowouts;
            allTimeClosestMatchups = leagueRecordArrays.combined.narrowestVictories;
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
    {lineupIQs}
    {tradesData}
    {waiversData}
    prefix="All-Time"
    allTime={true}
    regular={selection == 'regular'}
    bind:selection={selection}
/>
