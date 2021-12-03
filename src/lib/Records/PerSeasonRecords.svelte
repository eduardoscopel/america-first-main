<script>
    import {round} from '$lib/utils/helper';
  	import RecordsAndRankings from './RecordsAndRankings.svelte';
    import { Icon } from '@smui/tab';

    export let leagueRosterRecords, seasonWeekRecords, allManagers, currentYear, lastYear, transactionTotals, managerRecords;

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
            medianRecords: [],
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

    for(const key in arraysObj) {
        for(const recordType in arraysObj[key]) {
            yearsObj[key].winPercentages = arraysObj[key][recordType].managerBests.winRecords;
            yearsObj[key].fptsHistories = arraysObj[key][recordType].managerBests.cumulativePoints;
            yearsObj[key].medianRecords = arraysObj[key][recordType].managerBests.medianRecords;
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
        if(!yearsObj[season]) {
            continue;
        }
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

            yearsObj[season.year].lineupIQs.push(lineupIQ);
        }
    }

    for(const key in yearsObj) {
        // sort records
        yearsObj[key].seasonLongLows = arraysObj[key].regularSeason.period_Low;
        yearsObj[key].seasonLongRecords = arraysObj[key].regularSeason.period_Top;
        
        // sort rankings
        yearsObj[key].lineupIQs.sort((a, b) => b.iq - a.iq);
        yearsObj[key].tradesData.sort((a, b) => b.trades - a.trades);
        yearsObj[key].waiversData.sort((a, b) => b.waivers - a.waivers);

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
        let waiversData, tradesData, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, medianRecords, lineupIQs, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekTOPS, playerWeekBests, playerWeekMissedBests, playerWeekMissedTOPS, headToHeadRecords, leaguePlayerRecords;

        let key = displayYear;
        if(displayStats == 'regular') {
            showTies = yearsObj[key].showTies;
            lineupIQs = yearsObj[key].lineupIQs;
            winPercentages = arraysObj[key].regularSeason.managerBests.winRecords;
            fptsHistories = arraysObj[key].regularSeason.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].regularSeason.managerBests.medianRecords;
            tradesData = yearsObj[key].tradesData;
            waiversData = yearsObj[key].waiversData;

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
            seasonEPERecords = arraysObj[key].regularSeason.managerBests.epeRecords;
            winPercentages = arraysObj[key].regularSeason.managerBests.winRecords;
            fptsHistories = arraysObj[key].regularSeason.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].regularSeason.managerBests.medianRecords;

            playerSeasonBests = arraysObj[key].regularSeason.players.period_Best;
            playerWeekBests = arraysObj[key].regularSeason.players.week_Best;
            playerWeekMissedBests = arraysObj[key].regularSeason.players.week_MissedBest;

            headToHeadRecords = managerRecords.headToHeadRecords.regularSeason.years[key]; 
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].regularSeason;

            if(displayPositionRecord == 'ALL') {
                playerWeekTOPS = arraysObj[key].regularSeason.players.week_Top;
                playerSeasonTOPS = arraysObj[key].regularSeason.players.period_Top;
                playerWeekMissedTOPS = arraysObj[key].regularSeason.players.week_MissedTop;
            } else {
                playerWeekTOPS = managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].week_Top;
                playerSeasonTOPS = managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].period_Top;
                playerWeekMissedTOPS = managerRecords.leaguePlayerRecords.years[key].regularSeason[displayPositionRecord].week_MissedTop;
            }
            
        } else if(displayStats == 'playoffs') {
            showTies = yearsObj[key].showTies;
            lineupIQs = yearsObj[key].lineupIQs;
            winPercentages = arraysObj[key].playoffs.managerBests.winRecords;
            fptsHistories = arraysObj[key].playoffs.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].playoffs.managerBests.medianRecords;
            tradesData = yearsObj[key].tradesData;
            waiversData = yearsObj[key].waiversData;

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
            seasonEPERecords = arraysObj[key].playoffs.managerBests.epeRecords;
            winPercentages = arraysObj[key].playoffs.managerBests.winRecords;
            fptsHistories = arraysObj[key].playoffs.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].playoffs.managerBests.medianRecords;

            playerSeasonBests = arraysObj[key].playoffs.players.period_Best;
            playerWeekBests = arraysObj[key].playoffs.players.week_Best;
            playerWeekMissedBests = arraysObj[key].playoffs.players.week_MissedBest;

            headToHeadRecords = managerRecords.headToHeadRecords.playoffs.years[key];
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].playoffs;
            if(displayPositionRecord == 'ALL') {
                playerWeekTOPS = arraysObj[key].playoffs.players.week_Top;
                playerSeasonTOPS = arraysObj[key].playoffs.players.period_Top;
                playerWeekMissedTOPS = arraysObj[key].playoffs.players.week_MissedTop;
            } else {
                playerWeekTOPS = managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].week_Top;
                playerSeasonTOPS = managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].period_Top;
                playerWeekMissedTOPS = managerRecords.leaguePlayerRecords.years[key].playoffs[displayPositionRecord].week_MissedTop;
            }
        } else if(displayStats == 'combined') {

            showTies = yearsObj[key].showTies;
            lineupIQs = yearsObj[key].lineupIQs;
            winPercentages = arraysObj[key].combined.managerBests.winRecords;
            fptsHistories = arraysObj[key].combined.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].combined.managerBests.medianRecords;
            tradesData = yearsObj[key].tradesData;
            waiversData = yearsObj[key].waiversData;

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
            seasonEPERecords = arraysObj[key].combined.managerBests.epeRecords;
            winPercentages = arraysObj[key].combined.managerBests.winRecords;
            fptsHistories = arraysObj[key].combined.managerBests.cumulativePoints;
            medianRecords = arraysObj[key].combined.managerBests.medianRecords;

            playerSeasonBests = arraysObj[key].combined.players.period_Best;
            playerWeekBests = arraysObj[key].combined.players.week_Best;
            playerWeekMissedBests = arraysObj[key].combined.players.week_MissedBest;

            headToHeadRecords = managerRecords.headToHeadRecords.combined.years[key];
            leaguePlayerRecords = managerRecords.leaguePlayerRecords.years[key].combined;
            if(displayPositionRecord == 'ALL') {
                playerWeekTOPS = arraysObj[key].combined.players.week_Top;
                playerSeasonTOPS = arraysObj[key].combined.players.period_Top;
                playerWeekMissedTOPS = arraysObj[key].combined.players.week_MissedTop;
            } else {
                playerWeekTOPS = managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].week_Top;
                playerSeasonTOPS = managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].period_Top;
                playerWeekMissedTOPS = managerRecords.leaguePlayerRecords.years[key].combined[displayPositionRecord].week_MissedTop;
            }
        }

        displayObject[displayStats] = {
            lineupIQs,
            weekRecords,
            weekLows,
            seasonLongRecords,
            seasonLongLows,
            seasonEPERecords,
            seasonWorsts,
            seasonBests,
            weekBests,
            weekWorsts,
            playerSeasonTOPS,
            playerSeasonBests,
            playerWeekBests,
            playerWeekMissedBests,
            playerWeekTOPS,
            playerWeekMissedTOPS,
            blowouts,
            closestMatchups,
            winPercentages,
            fptsHistories,
            medianRecords,
            tradesData,
            waiversData,
            headToHeadRecords,
        }

        return {waiversData, tradesData, weekRecords, weekLows, seasonLongRecords, seasonLongLows, showTies, winPercentages, fptsHistories, medianRecords, lineupIQs, blowouts, closestMatchups, weekBests, weekWorsts, seasonBests, seasonWorsts, seasonEPERecords, playerSeasonTOPS, playerSeasonBests, playerWeekTOPS, playerWeekBests, playerWeekMissedBests, playerWeekMissedTOPS, headToHeadRecords, leaguePlayerRecords};
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
        background-color: #222;
        box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    .yearText {
        text-align: center;
        font-size: 2.25em;
        font-weight: 450;
        color: var(--g111);
    }

    :global(.changeYear) {
        z-index: 1;
        font-size: 2.25em;
        cursor: pointer;
        color: #888;
    }

    :global(.changeYear:hover) {
        color: #00316b;
    }

    .spacer {
        width: 48px;
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
        headToHeadRecords = {yearArrays.headToHeadRecords}
        leaguePlayerRecords = {yearArrays.leaguePlayerRecords}
        prefix={displayYear}
        {allManagers}
        regular={selection == 'regular'}
        bind:selection={selection}
        bind:displayYear={displayYear}
        bind:displayPositionRecord={displayPositionRecord}
    />
