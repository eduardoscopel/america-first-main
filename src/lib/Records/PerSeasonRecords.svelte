<script>
    import {round} from '$lib/utils/helper';
  	import RecordsAndRankings from './RecordsAndRankings.svelte';

    export let selection, leagueRosterRecords, seasonWeekRecords, currentManagers, allTimeWeekBests, allTimeWeekWorsts, allTimeSeasonBests, allTimeSeasonWorsts, allTimeEPERecords, currentYear, lastYear, transactionTotals;

    const yearsObj = {};
    let years = [];

    let loopYear = currentYear;
    while(loopYear >= lastYear) {
        yearsObj[loopYear] = {
            seasonLongRecords: [],
	        seasonLongLows: [],
            winPercentages: [],
            lineupIQs: [],
            fptsHistories: [],
            tradesData: [],
            waiversData: [],
            blowouts: [],
            closestMatchups: [],
            weekBests: [],
            weekWorsts: [],
            seasonBests: [],
            seasonWorsts: [],
            seasonEPERecords: [],
            playerSeasonTOPS: [],
            playerSeasonBests: [],
            playerWeekTOPS: [],
            playerWeekBests: [],
            playerWeekMissedBests: [],
            playerWeekMissedTOPS: [],
            showTies: false,
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
        for(const recordType in seasonWeekRecord.leagueRecordArrays) {
            arraysObj[seasonWeekRecord.year][recordType] = seasonWeekRecord.leagueRecordArrays[recordType];
        }
    }

    for(const seasonWeekRecord of seasonWeekRecords) {
        yearsObj[seasonWeekRecord.year].weekRecords = seasonWeekRecord.leagueRecordArrays.regularSeason.week_Top;
	    yearsObj[seasonWeekRecord.year].weekLows = seasonWeekRecord.leagueRecordArrays.regularSeason.week_Low;
        yearsObj[seasonWeekRecord.year].blowouts = seasonWeekRecord.leagueRecordArrays.regularSeason.biggestBlowouts;
        yearsObj[seasonWeekRecord.year].closestMatchups = seasonWeekRecord.leagueRecordArrays.regularSeason.narrowestVictories;
        yearsObj[seasonWeekRecord.year].weekBests = seasonWeekRecord.leagueRecordArrays.regularSeason.managerBests.week_Best;
        yearsObj[seasonWeekRecord.year].weekWorsts = seasonWeekRecord.leagueRecordArrays.regularSeason.managerBests.week_Worst;
        yearsObj[seasonWeekRecord.year].seasonBests = seasonWeekRecord.leagueRecordArrays.regularSeason.managerBests.period_Best;
        yearsObj[seasonWeekRecord.year].seasonWorsts = seasonWeekRecord.leagueRecordArrays.regularSeason.managerBests.period_Worst;
        yearsObj[seasonWeekRecord.year].seasonEPERecords = seasonWeekRecord.leagueRecordArrays.regularSeason.managerBests.epeRecords;
        yearsObj[seasonWeekRecord.year].playerSeasonTOPS = seasonWeekRecord.leagueRecordArrays.regularSeason.players.period_Top;
        yearsObj[seasonWeekRecord.year].playerSeasonBests = seasonWeekRecord.leagueRecordArrays.regularSeason.players.period_Best;
        yearsObj[seasonWeekRecord.year].playerWeekTOPS = seasonWeekRecord.leagueRecordArrays.regularSeason.players.week_Top;
        yearsObj[seasonWeekRecord.year].playerWeekBests = seasonWeekRecord.leagueRecordArrays.regularSeason.players.week_Best;
        yearsObj[seasonWeekRecord.year].playerWeekMissedBests = seasonWeekRecord.leagueRecordArrays.regularSeason.players.week_MissedBest;
        yearsObj[seasonWeekRecord.year].playerWeekMissedTOPS = seasonWeekRecord.leagueRecordArrays.regularSeason.players.week_MissedTop;
    }
    
    for(const season in transactionTotals.seasons) {
        if(!yearsObj[season]) continue;
        for(const recordManID in transactionTotals.seasons[season]) {
            yearsObj[season].tradesData.push({
                recordManID: transactionTotals.seasons[season][recordManID].recordManID,
                manager: transactionTotals.seasons[season][recordManID].manager,
                trades: transactionTotals.seasons[season][recordManID].trade,
            })
            yearsObj[season].waiversData.push({
                recordManID: transactionTotals.seasons[season][recordManID].recordManID,
                manager: transactionTotals.seasons[season][recordManID].manager,
                waivers: transactionTotals.seasons[season][recordManID].waiver,
            })
        }
    }

    for(const recordManID in leagueRosterRecords) {
        const leagueRosterRecord = leagueRosterRecords[recordManID];
        for(const season of leagueRosterRecord.years) {
            // check for ties
            if(season.ties > 0) {
                yearsObj[season.year].showTies = true;
            }

			const fpts = season.fpts;
			const fptspg = season.fpts / (season.wins + season.losses + season.ties);

            // add season-long scoring record
            yearsObj[season.year].seasonLongRecords.push({
                manager: season.manager,
				recordManID,
				fpts,
		    	fptspg,
				year: null,
			})

            // add win percentage rankings
            yearsObj[season.year].winPercentages.push({
                recordManID,
                manager: season.manager,
                percentage: round((season.wins + season.ties / 2) / (season.wins + season.ties + season.losses) * 100),
                wins: season.wins,
                ties: season.ties,
                losses: season.losses,
            })

            // add lineup IQ rankings
            let lineupIQ = {
                recordManID,
                manager: season.manager,
                fpts: round(season.fpts),
            }
            if(season.potentialPoints) {
                lineupIQ.iq = round(season.fpts / season.potentialPoints * 100);
                lineupIQ.potentialPoints = round(season.potentialPoints);
            }

            yearsObj[season.year].lineupIQs.push(lineupIQ)

            // add fantasy points histories
            yearsObj[season.year].fptsHistories.push({
                recordManID,
                manager: season.manager,
                fptsFor: round(season.fpts),
                fptsAgainst: round(season.fptsAgainst),
		        fptsPerGame: round(season.fpts / (season.wins + season.losses + season.ties)),
            })

        }

    }

    for(const key in yearsObj) {
        // sort records
        yearsObj[key].seasonLongLows = yearsObj[key].seasonLongRecords.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10);
        yearsObj[key].seasonLongRecords = yearsObj[key].seasonLongRecords.sort((a, b) => b.fpts - a.fpts).slice(0, 10);
        
        // sort rankings
        yearsObj[key].winPercentages.sort((a, b) => b.percentage - a.percentage);
        yearsObj[key].lineupIQs.sort((a, b) => b.iq - a.iq);
        yearsObj[key].fptsHistories.sort((a, b) => b.fptsFor - a.fptsFor);
        yearsObj[key].tradesData.sort((a, b) => b.trades - a.trades);
        yearsObj[key].waiversData.sort((a, b) => b.waivers - a.waivers);

        // add to array
        years.push(yearsObj[key]);
    }

    years.sort((a, b) => b.year - a.year);

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
            let regularYears = [];
            for(const key in yearsObj) {
                yearsObj[key].weekRecords = arraysObj[key].regularSeason.week_Top;
                yearsObj[key].weekLows = arraysObj[key].regularSeason.week_Low;
                yearsObj[key].seasonLongRecords = arraysObj[key].regularSeason.period_Top;
                yearsObj[key].seasonLongLows = arraysObj[key].regularSeason.period_Low;
                yearsObj[key].blowouts = arraysObj[key].regularSeason.biggestBlowouts;
                yearsObj[key].closestMatchups = arraysObj[key].regularSeason.narrowestVictories;

                yearsObj[key].weekBests = arraysObj[key].regularSeason.managerBests.week_Best;
                yearsObj[key].weekWorsts = arraysObj[key].regularSeason.managerBests.week_Worst;
                yearsObj[key].seasonBests = arraysObj[key].regularSeason.managerBests.period_Best;
                yearsObj[key].seasonWorsts = arraysObj[key].regularSeason.managerBests.period_Worst;
                yearsObj[key].seasonEPERecords = arraysObj[key].regularSeason.managerBests.epeRecords;

                yearsObj[key].playerSeasonTOPS = arraysObj[key].regularSeason.players.period_Top;
                yearsObj[key].playerSeasonBests = arraysObj[key].regularSeason.players.period_Best;
                yearsObj[key].playerWeekBests = arraysObj[key].regularSeason.players.week_Best;
                yearsObj[key].playerWeekMissedBests = arraysObj[key].regularSeason.players.week_MissedBest;
                yearsObj[key].playerWeekTOPS = arraysObj[key].regularSeason.players.week_Top;
                yearsObj[key].playerWeekMissedTOPS = arraysObj[key].regularSeason.players.week_MissedTop;
                
                regularYears.push(yearsObj[key]);
            }
            years = regularYears.sort((a, b) => b.year - a.year);
        } else if(displayStats == 'playoffs') {
            let playoffYears = [];
            for(const key in yearsObj) {
                yearsObj[key].weekRecords = arraysObj[key].playoffs.week_Top;
                yearsObj[key].weekLows = arraysObj[key].playoffs.week_Low;
                yearsObj[key].seasonLongRecords = arraysObj[key].playoffs.period_Top;
                yearsObj[key].seasonLongLows = arraysObj[key].playoffs.period_Low;
                yearsObj[key].blowouts = arraysObj[key].playoffs.biggestBlowouts;
                yearsObj[key].closestMatchups = arraysObj[key].playoffs.narrowestVictories;

                yearsObj[key].weekBests = arraysObj[key].playoffs.managerBests.week_Best;
                yearsObj[key].weekWorsts = arraysObj[key].playoffs.managerBests.week_Worst;
                yearsObj[key].seasonBests = arraysObj[key].playoffs.managerBests.period_Best;
                yearsObj[key].seasonWorsts = arraysObj[key].playoffs.managerBests.period_Worst;
                yearsObj[key].seasonEPERecords = arraysObj[key].playoffs.managerBests.epeRecords;

                yearsObj[key].playerSeasonTOPS = arraysObj[key].playoffs.players.period_Top;
                yearsObj[key].playerSeasonBests = arraysObj[key].playoffs.players.period_Best;
                yearsObj[key].playerWeekBests = arraysObj[key].playoffs.players.week_Best;
                yearsObj[key].playerWeekMissedBests = arraysObj[key].playoffs.players.week_MissedBest;
                yearsObj[key].playerWeekTOPS = arraysObj[key].playoffs.players.week_Top;
                yearsObj[key].playerWeekMissedTOPS = arraysObj[key].playoffs.players.week_MissedTop;

                playoffYears.push(yearsObj[key]);
            }
            years = playoffYears.sort((a, b) => b.year - a.year);
        } else if(displayStats == 'combined') {
            let combinedYears = [];
            for(const key in yearsObj) {
                yearsObj[key].weekRecords = arraysObj[key].combined.week_Top;
                yearsObj[key].weekLows = arraysObj[key].combined.week_Low;
                yearsObj[key].seasonLongRecords = arraysObj[key].combined.period_Top;
                yearsObj[key].seasonLongLows = arraysObj[key].combined.period_Low;
                yearsObj[key].blowouts = arraysObj[key].combined.biggestBlowouts;
                yearsObj[key].closestMatchups = arraysObj[key].combined.narrowestVictories;

                yearsObj[key].weekBests = arraysObj[key].combined.managerBests.week_Best;
                yearsObj[key].weekWorsts = arraysObj[key].combined.managerBests.week_Worst;
                yearsObj[key].seasonBests = arraysObj[key].combined.managerBests.period_Best;
                yearsObj[key].seasonWorsts = arraysObj[key].combined.managerBests.period_Worst;
                yearsObj[key].seasonEPERecords = arraysObj[key].combined.managerBests.epeRecords;

                yearsObj[key].playerSeasonTOPS = arraysObj[key].combined.players.period_Top;
                yearsObj[key].playerSeasonBests = arraysObj[key].combined.players.period_Best;
                yearsObj[key].playerWeekBests = arraysObj[key].combined.players.week_Best;
                yearsObj[key].playerWeekMissedBests = arraysObj[key].combined.players.week_MissedBest;
                yearsObj[key].playerWeekTOPS = arraysObj[key].combined.players.week_Top;
                yearsObj[key].playerWeekMissedTOPS = arraysObj[key].combined.players.week_MissedTop;

                combinedYears.push(yearsObj[key]);
            }
            years = combinedYears.sort((a, b) => b.year - a.year);
        }
    }

    $: setSelected(displayStats);

</script>

{#each years as {waiversData, tradesData, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, lineupIQs, year, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, allTimeWeekBests, allTimeWeekWorsts, allTimeSeasonBests, allTimeSeasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekTOPS, playerWeekBests, playerWeekMissedBests, playerWeekMissedTOPS}, ix}
    <RecordsAndRankings
        {waiversData}
        {tradesData}
        {weekRecords}
	    {weekLows}
        {seasonLongRecords}
	    {seasonLongLows}
        {showTies}
        {winPercentages}
        {fptsHistories}
        {lineupIQs}
        {blowouts}
        {closestMatchups}
        {weekBests}
        {weekWorsts}
        {seasonBests}
        {seasonWorsts}
        {allTimeWeekBests} 
        {allTimeWeekWorsts}
        {allTimeSeasonBests} 
        {allTimeSeasonWorsts}
        {seasonEPERecords}
        {playerSeasonTOPS}
        {playerSeasonBests}
        {playerWeekTOPS}
        {playerWeekBests}
        {playerWeekMissedBests}
        {playerWeekMissedTOPS}
        prefix={year}
        {currentManagers}
        last={ix == years.length - 1}
        regular={selection == 'regular'}
        bind:selection={selection}
    />
{/each}