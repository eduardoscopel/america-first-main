<script>
    import Button, { Group, Label } from '@smui/button';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 
	import LinearProgress from '@smui/linear-progress';
    import {loadPlayers, getLeagueStandings, getNflState, getLeagueData, getTable, leagueID, round} from '$lib/utils/helper';
	import Roster from '../Rosters/Roster.svelte';
	import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import { goto } from '$app/navigation';
    import ManagerFantasyInfo from './ManagerFantasyInfo.svelte';
    import ManagerAwards from './ManagerAwards.svelte';
    import { onMount } from 'svelte';
    import PlayerTable from './PlayerTable.svelte';
    import PancakeTable from './PancakeTable.svelte';

    export let manager, managers, rostersData, users, rosterPositions, transactions, currentManagers, awards, records, managerRecords;

    let showRoster = new Boolean (true);
    let viewManager = managers[manager];
    let recordManID = viewManager.managerID;

    let profilePic = viewManager.photo;
    // default profile picture
    if(profilePic == '/managers/name.jpg') {
        profilePic = '/managers/profile-empty-gray.png'
    }

    let firstYear = viewManager.yearsactive[0];
    let inactiveLastYear; 
    let inactiveLastManaged;
    if(viewManager.status == "inactive") {
        showRoster = false;
        inactiveLastYear = viewManager.yearsactive[viewManager.yearsactive.length - 1];
        inactiveLastManaged = records.leagueRosterRecords[recordManID].manager;
    }

    let teamTransactions = transactions.filter(t => t.rosters.indexOf(viewManager.roster) > -1 && t.recordManIDs.includes(recordManID));

    let startersAndReserve = rostersData.startersAndReserve;
    let rosters = rostersData.rosters;

    let rosterArrNum = viewManager.roster-1;

    let roster = rosters[rosterArrNum];  

    let user = users[roster.owner_id];

    let players, playersInfo;
    let positionsInfo;
    let loading = true;
    let curSeason = leagueID;
    let currentYear;
    let nflStated;
    let leagueDatum;
    let standings;
    let seasons = [];

    for(const year in records.leagueRosterRecords[recordManID].years) {
        const season = records.leagueRosterRecords[recordManID].years[year];
        
        if(!currentYear) {
            currentYear = season.year;
        }

        let seasonEntry = {
            year: season.year,
            wins: season.wins,
            losses: season.losses,
            ties: season.ties,
            fpts: season.fpts,
            fptsAgainst: season.fptsAgainst,
            fptspg: season.fptspg,
            manager: season.manager,
            regSeasonRank: 0,
            regSeasonRankSuper: null,
            finalRank: null,
            finalRankSuper: null,
            showTies: new Boolean (false),
        }
        if(season.ties > 0) {
            seasonEntry.showTies = true;
        } else {
            seasonEntry.showTies = false;
        }
        seasons.push(seasonEntry);
    }

    let managerKeys = {};
    for(const key in seasons) {
        const season = seasons[key];
        const sortOrder = ["fptsAgainst", "fpts", "ties", "wins"];
        let playerSeasons = [];
        let yearManagers = managers.filter(m => m.yearsactive.includes(season.year));

        for(const yearManager in yearManagers) {
            const yearRecordManID = yearManagers[yearManager].managerID;
            if(!managerKeys[yearRecordManID] && season.year == yearManagers[yearManager].yearsactive[yearManagers[yearManager].yearsactive.length - 1]) {
                managerKeys[yearRecordManID] = 0;
            } else {
                managerKeys[yearRecordManID] = yearManagers[yearManager].yearsactive[yearManagers[yearManager].yearsactive.length - 1] - season.year;
            }

            playerSeasons.push(records.leagueRosterRecords[yearRecordManID].years[managerKeys[yearRecordManID]]);
            managerKeys[yearRecordManID]++;
        }

        const calculateRank = (playerSeasons, sortOrder, recordManID) => {
            for(const sortType of sortOrder) {
                if(!playerSeasons[0][sortType] && playerSeasons[0][sortType] != 0) {
                    continue;
                }
                playerSeasons = [...playerSeasons].sort((a,b) => b[sortType] - a[sortType]);
            }
            let regSeasonRank = playerSeasons.indexOf(playerSeasons.find(p => p.recordManID == recordManID)) + 1;
            let playerSeasonRanked = playerSeasons;
            let regSeasonRankSuper;
            if(regSeasonRank == 1) {
                regSeasonRankSuper = "st";
            } else if(regSeasonRank == 2) {
                regSeasonRankSuper = "nd";
            } else if(regSeasonRank == 3) {
                regSeasonRankSuper = "rd";
            } else if(regSeasonRank > 3) {
                regSeasonRankSuper = "th";
            }            

            return {playerSeasonRanked, regSeasonRank, regSeasonRankSuper};
        }
        let {playerSeasonRanked, regSeasonRank, regSeasonRankSuper} = calculateRank(playerSeasons, sortOrder, recordManID);

        // TO-DO: need to get final ranks of managers who didn't place in either bracket
        // this bit only works because that doesn't apply in my league (12 teams, 6 playoff, 6 losers)
        for(const completedSeason in awards.finalRanks) {
            if(awards.finalRanks[completedSeason].year == season.year) {
                for(const rank in awards.finalRanks[completedSeason]) {
                    if(awards.finalRanks[completedSeason][rank]?.recordManID == recordManID) {
                        season.finalRank = rank;
                    }
                }
            }
        }

        if(season.finalRank == 1) {
            season.finalRankSuper = "st";
        } else if(season.finalRank == 2) {
            season.finalRankSuper = "nd";
        } else if(season.finalRank == 3) {
            season.finalRankSuper = "rd";
        } else if(season.finalRank > 3) {
            season.finalRankSuper = "th";
        }       

        season.regSeasonRank = regSeasonRank;
        season.regSeasonRankSuper = regSeasonRankSuper;
    }

    // Overall Win - Loss Record
    let recordHistory = {
        wins: records.leagueRecordArrays.combined.managerBests.winRecords.find(m => m.recordManID == recordManID).wins,
        losses: records.leagueRecordArrays.combined.managerBests.winRecords.find(m => m.recordManID == recordManID).losses,
        ties: records.leagueRecordArrays.combined.managerBests.winRecords.find(m => m.recordManID == recordManID).ties,
        winPerc: records.leagueRecordArrays.combined.managerBests.winRecords.find(m => m.recordManID == recordManID).winPerc,
        showTies: new Boolean (false),
    }
    if(recordHistory.ties > 0) {
        recordHistory.showTies = true;
    } else {
        recordHistory.showTies = false;
    }
    // Overall EPE Win - Loss Record
    let epeHistory = {
        wins: records.leagueRecordArrays.combined.managerBests.epeRecords.find(m => m.recordManID == recordManID).epeWins,
        losses: records.leagueRecordArrays.combined.managerBests.epeRecords.find(m => m.recordManID == recordManID).epeLosses,
        ties: records.leagueRecordArrays.combined.managerBests.epeRecords.find(m => m.recordManID == recordManID).epeTies,
        epePerc: records.leagueRecordArrays.combined.managerBests.epeRecords.find(m => m.recordManID == recordManID).epePerc,
        showTies: new Boolean (false),
    }
    if(epeHistory.ties > 0) {
        epeHistory.showTies = true;
    } else {
        epeHistory.showTies = false;
    }
    // FPTS history
    let fptsHistory = {
        fpts: records.leagueRecordArrays.combined.managerBests.cumulativePoints.find(m => m.recordManID == recordManID).fpts,
        fptsAgainst: records.leagueRecordArrays.combined.managerBests.cumulativePoints.find(m => m.recordManID == recordManID).fptsAgainst,
        fptspg: records.leagueRecordArrays.combined.managerBests.cumulativePoints.find(m => m.recordManID == recordManID).fptspg,
    }
    // Median Win - Loss Record
    let medianHistory = {
        wins: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).weekWinners,
        losses: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).weekLosers,
        ties: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).weekTies,
        medianPerc: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).medianPerc,
        topScores: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).topScores,
        bottomScores: records.leagueRecordArrays.combined.managerBests.medianRecords.find(m => m.recordManID == recordManID).bottomScores,
        showTies: new Boolean (false),
    }
    if(medianHistory.ties > 0) {
        medianHistory.showTies = true;
    } else {
        medianHistory.showTies = false;
    }
    // Championship icons
    let shipsTrophies = [];
    let championships = 0;
    for(const podium of awards.podiums) {
        if(podium.champion.recordManID == recordManID) {
            championships++;
        }
    }
    if(championships > 0) {
        for(let i = 0; i < championships; i++) {
            shipsTrophies.push(i);
        }
    }

    onMount(async () => {
        const playerData = await loadPlayers();
        playersInfo = playerData;
        players = playerData.players;

        if(playerData.stale) {
            const newPlayerData = await loadPlayers(true);
            playersInfo = newPlayerData;
            players = newPlayerData.players;
        }

        let recordManID = viewManager.managerID;
        const positionsData = await getTable(recordManID);
        positionsInfo = positionsData;

        loading = false;
    })
    // current standings info
    const calculateRecord = async (standings, leagueDatum, nflStated, curSeason, viewManager) => {
        const standingsData = await getLeagueStandings().catch((err) => { console.error(err); });
        standings = standingsData;
        const leagueData = await getLeagueData(curSeason).catch((err) => { console.error(err); });
        leagueDatum = leagueData;
        const nflState = await getNflState().catch((err) => { console.error(err); });
        nflStated = nflState; 

        const standingsObject = standings.standingsInfo;
        for(const standingKey in standingsObject) {
            const rosterX = standings.rostersData[standingsObject[standingKey].rosterID - 1];

            standingsObject[standingKey].fpts = round(rosterX.settings.fpts + (rosterX.settings.fpts_decimal / 100));
            standingsObject[standingKey].fptsAgainst = round(rosterX.settings.fpts_against + (rosterX.settings.fpts_against_decimal / 100));
            standingsObject[standingKey].streak = rosterX.metadata.streak;
        }

        let finalStandings = Object.keys(standingsObject).map((key) => standingsObject[key]);

        const sortOrder = ["fptsAgainst", "fpts", "ties", "wins"];
        for(const sortType of sortOrder) {
            if(!finalStandings[0][sortType] && finalStandings[0][sortType] != 0) {
                continue;
            }
            finalStandings = [...finalStandings].sort((a,b) => b[sortType] - a[sortType]);
        }

        standingsRank = finalStandings.indexOf(finalStandings.find(m => m.rosterID == viewManager.roster)) + 1;
    
        if(standingsRank == 1) {
            rankSuper = "st";
        } else if(standingsRank == 2) {
            rankSuper = "nd";
        } else if(standingsRank == 3) {
            rankSuper = "rd";
        } else if(standingsRank > 3) {
            rankSuper = "th";
        }

        if(leagueDatum.status == "complete" || nflStated.season_type == "pre" || viewManager.status == "inactive") {
            showRecord = false;
        } else {
            showRecord = true;
            wins = standings.standingsInfo[viewManager.roster].wins;
            losses = standings.standingsInfo[viewManager.roster].losses;
            ties = standings.standingsInfo[viewManager.roster].ties;
            if(ties == 0) {
                showTies = false;
            } else {
                showTies = true;
            }
        }

        return {wins, losses, ties, showTies, showRecord, standingsRank, rankSuper};
    }

    let { wins, losses, ties, showTies, showRecord, standingsRank, rankSuper } = calculateRecord(standings, leagueDatum, nflStated, curSeason, viewManager);

    const changeManager = (newManager, noscroll = false) => {
        manager = newManager;
        recordManID = newManager;
        viewManager = managers[newManager];

        teamTransactions = transactions.filter(t => t.rosters.indexOf(viewManager.roster) > -1);

        startersAndReserve = rostersData.startersAndReserve;
        rosters = rostersData.rosters;

        if(viewManager.status == "active") {
            showRecord = true;
        } else {
            showRecord = false;
        }

        rosterArrNum = viewManager.roster-1;

        roster = rosters[rosterArrNum];

        user = users[roster.owner_id];
        goto(`/managers?manager=${manager}`, {noscroll})
    }

    let el, masterOffset, innerWidth;

    const setOffset = (w) => {
        return el?.getBoundingClientRect() ? el?.getBoundingClientRect().left  : 0;
    }

    $: masterOffset = setOffset(innerWidth);
</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    .managerContainer {
        width: 100%;
        margin: 2em 0 5em;
        position: relative;
        display: inline-flex;
        flex-direction: column;
    }

    .managerConstrained {
        width: 75em;
        min-height: 60em;
        margin: 0 auto 4em;
        position: relative;
        display: inline-flex;
        flex-direction: column;
    }

    .managerBlock {
        position: relative;
        width: 100%;
        min-height: 100%;
		background-color: var(--gcBanner);
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    #managerName {
        display: inline-flex;
        position: relative;
        width: 100%;
        padding: 15px 0;
		background-color: var(--gcMain);
        box-shadow: 5px 0 8px var(--champShadow);
    }

    .managerNamed {
        display: inline-flex;
        position: relative;
        flex-direction: column;
		background-color: var(--gcMain);
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 0.2em 0em 0em;
        line-height: 1.3em;
    }

    .teamSub {
        font-size: 0.47em;
        line-height: 1em;
        text-align: left;
        margin: 10px 0 0 0;
        color: var(--gcPlayText);
    }

    .managerPlacement {
        display: inline-flex;
		background-color: var(--gcMain);
        position: relative;
        right: 0.7em;
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 0.2em 0em 0em 1.7em ;
        line-height: 1em;
    }

    .managerRecord {
        display: inline-block;
		background-color: var(--gcMain);
        position: relative;
        right: 0.7em;
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 2em 0em 0em 1.7em ;
        line-height: 1em;
    }

    .managerPhoto {
        display: inline-flex;
        border-radius: 20%;
        width: 20%;
        max-width: 200px;
        height: auto;
        margin: 0.15em 1em 0.15em;
        box-shadow: 0 0 8px 4px #aaa;
    }

    .shipsTrophies {
        max-width: 20px;
        max-height: 60px;
        margin: 10px 0 0 0;
    }

    .historyProfile {
        padding: 1%;
        position: relative;
        display: inline-flex;
        min-height: 40em;
        width: 98%;
		background-color: var(--gcBox);
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    .columnWrap {
        position: relative;
        display: inline-flex;
        flex-direction: column;
        width: 50%;
        height: 100%;
        align-items: center;
        color: var(--gcBannerText);
    }

    .seasonHistory {
        width: 94%;
        justify-content: center;
        display: inline-flex;
        position: relative;
        background-color: var(--gcComponent);
        margin: 2% 0;
    }

    .overallHistory {
        width: 98%;
        position: relative;
        display: inline-flex;
        justify-content: center;
        background-color: var(--gcComponent);
        padding: 1%;
    }

    .summaryHeadings {
        display: inline-flex;
        position: relative;
        justify-content: space-evenly;
        align-items: center;
        vertical-align: center;
        background-color: var(--gcBanner);
        height: 8%;
        width: 100%;
    }

    .summaryHeadings span {
        color: var(--gcPlayRowText);
        font-size: 0.9em;
    }

    .summaryChild {
        font-style: italic;
    }

    .summaries {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        vertical-align: center;
        background-color: var(--f3f3f3);
        width: 50%;
        margin: 0 0;
    }

    .summaries span {
        color: #ffffff;
        font-size: 0.9em;
    }

    .summariesChild {
        font-style: bold;
    }

    .summariesChildMiddle {
        font-style: bold;
        border-left: var(--eee);
        border-right: var(--eee);
    }

    .rosterContainer {
        width: 100%;
        height: 100%;
        display: inline-flex;
        position: relative;
        justify-content: center;
        align-items: center;
    }

    :global(.historyTable) {
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
        margin: 0em;
        font-size: 0.6em;
    }

    :global(.historyTable th) {
        font-size: 1.5em;
        padding: 5px;
        height: 50px;
    }
    :global(.historyTable span) {
        font-size: 1.5em;
        padding: 5px;
        height: 50px;
    }
    :global(.historyTable td) {
        font-size: 1em;
        padding: 7px;
        height: 30px;
    }

    :global(.header) {
        text-align: center;
    }

    :global(.teamName) {
        text-align: left;
    }

    h3 {
        text-align: center;
        font-size: 1.5em;
        margin: 1.5em 0 0.5em;
        font-weight: 200;
    }

    .basicInfo {
        display: inline-flex;
        position: relative;
        justify-content: space-evenly;
        align-items: center;
        height: 50px;
        width: 100%;
    }

    .basicInfo span {
        color: var(--gcPlayRowText);
        font-size: 0.9em;
    }

    .infoChild {
        font-style: italic;
    }

    .infoContact {
        height: 20px;
        vertical-align: middle;
        padding-left: 1em;
    }

    .infoTeam {
        height: 48px;
    }

    .bio {
        margin: 2em 1.5em 2em;
        text-indent: 4em;
    }

    .philosophy {
        margin: 2em 1.5em 2em;
        text-indent: 4em;
    }

    .loading {
        display: block;
        width: 85%;
        max-width: 500px;
        margin: 80px auto;
    }

    .managerNav {
        margin: 4em 0 2em;
        text-align: center;
    }

    .upper {
        margin-top: 0;
    }

    /* media queries */

    @media (max-width: 505px) {
        :global(.selectionButtons span) {
            font-size: 0.8em;
        }
    }

    @media (max-width: 435px) {
        :global(.selectionButtons span) {
            line-height: 1.2em;
            font-size: 0.8em;
        }
    }

	@media (max-width: 450px) {

        .basicInfo {
            height: 20px;
        }

        .basicInfo span {
            font-size: 0.75em;
        }

        .infoTeam {
            height: 30px;
        }
	}

    @media (max-width: 370px) {

        .basicInfo {
            height: 18px;
        }

        .basicInfo span {
            font-size: 0.6em;
        }

        .infoTeam {
            height: 24px;
        }
    }
</style>

<div class="managerContainer">
    <div class="managerConstrained">
        <div class="managerNav upper">
            <Group variant="outlined">
                {#if manager == 0}
                    <Button disabled class="selectionButtons" on:click={() => changeManager(parseInt(manager) - 1, true)} variant="outlined">
                        <Label>Previous Manager</Label>
                    </Button>
                {:else}
                    <Button class="selectionButtons" on:click={() => changeManager(parseInt(manager) - 1, true)} variant="outlined">
                        <Label>Previous Manager</Label>
                    </Button>
                {/if}
                <Button class="selectionButtons" on:click={() => goto('/managers')} variant="outlined">
                    <Label>All Managers</Label>
                </Button>
                {#if manager == managers.length - 1}
                    <Button disabled class="selectionButtons" on:click={() => changeManager(parseInt(manager) + 1, true)} variant="outlined">
                        <Label>Next Manager</Label>
                    </Button>
                {:else}
                    <Button class="selectionButtons" on:click={() => changeManager(parseInt(manager) + 1, true)} variant="outlined">
                        <Label>Next Manager</Label>
                    </Button>
                {/if}
            </Group>
        </div>
        <div class="managerBlock">
            <div id="managerName">
                <div class="columnWrap" style="flex-direction: row;">
                    <img class="managerPhoto" src="{profilePic}" alt="manager"/>
                    <div class="managerNamed">
                        {viewManager.name}
                        <br>
                        {#if showRoster}
                            <div class="teamSub">{roster.co_owners ? 'Co-' : ''}Manager: <i>{user.metadata.team_name ? user.metadata.team_name : user.display_name}</i></div>
                        {:else}
                            <div class="teamSub">Last Managed: <i>{inactiveLastManaged.name}</i></div>
                        {/if}
                        {#each shipsTrophies as shipsTrophy}
                            <img class="shipsTrophies" src="/awards/champion.png" alt={shipsTrophy}/>                
                        {/each}
                    </div>
                </div>
                {#if showRecord}
                    <div class="columnWrap" style="align-items: flex-end;">
                        <div class="managerPlacement">{standingsRank}<sup>{rankSuper}</sup></div>
                        <div class="managerRecord">{showTies ? '(' + wins + ' - ' + ties + ' - ' + losses + ')' : '(' + wins + ' - ' + losses + ')'}</div>
                    </div>
                {/if}
            </div>
        </div>
        <div class="managerBlock">
            <div class="basicInfo">
                <span class="infoChild">{viewManager.location || 'Undisclosed Location'}</span>
                {#if viewManager.fantasyStart}
                    <!-- fantasyStart is an optional field -->
                    <span class="seperator">|</span>
                    <span class="infoChild">{showRoster ? 'Joined ' + firstYear : 'Managed ' + firstYear + ' - ' + inactiveLastYear}</span>
                {/if}
                {#if viewManager.preferredContact}
                    <!-- preferredContact is an optional field -->
                    <span class="seperator">|</span>
                    <span class="infoChild">{viewManager.preferredContact}<img class="infoChild infoContact" src="/{viewManager.preferredContact}.png" alt="favorite team"/></span>
                {/if}
                <!-- <span class="infoChild">{viewManager.preferredContact}</span> -->
                {#if viewManager.favoriteTeam}
                    <!-- favoriteTeam is an optional field -->
                    <span class="seperator">|</span>
                    <img class="infoChild infoTeam" src="https://sleepercdn.com/images/team_logos/nfl/{viewManager.favoriteTeam}.png" alt="favorite team"/>
                {/if}
            </div>
        </div>
        <div class="historyProfile">
            <div class="columnWrap">
                <div class="seasonHistory">
                    {#if seasons && seasons.length}
                        <DataTable class="historyTable">
                            <Head>
                                <Row>                        
                                    <Cell class="header" colspan=8>Team History</Cell>
                                </Row>
                                <Row>                        
                                    <Cell class="header">Year</Cell>
                                    <Cell class="header">Team</Cell>
                                    <Cell class="header">Record</Cell>
                                    <Cell class="header">PF</Cell>
                                    <Cell class="header">PA</Cell>
                                    <Cell class="header">PPG</Cell>
                                    <Cell class="header">RS</Cell>
                                    <Cell class="header">Final</Cell>
                                </Row>
                            </Head>
                            <Body>
                                {#each seasons as season}
                                    <Row>
                                        <Cell class="header">{season.year}</Cell>
                                        <Cell class="teamName">{season.manager.name}</Cell>
                                        <Cell class="header">{season.showTies ? season.wins + ' - ' + season.ties + ' - ' + season.losses : season.wins + ' - ' + season.losses}</Cell>
                                        <Cell class="header">{round(season.fpts)}</Cell>
                                        <Cell class="header">{round(season.fptsAgainst)}</Cell>
                                        <Cell class="header">{round(season.fptspg)}</Cell>
                                        <Cell class="header">{season.regSeasonRank}<sup>{season.regSeasonRankSuper}</sup></Cell>
                                        {#if season.finalRank}
                                            <Cell class="header">{season.finalRank}<sup>{season.finalRankSuper}</sup></Cell>
                                        {:else}
                                            <Cell class="header">-</Cell>
                                        {/if}
                                    </Row>
                                {/each}
                            </Body>
                        </DataTable>
                    {/if}
                </div>
                <div class="summaryHeadings">
                    <span class="summaryChild">League</span>
                    <span class="seperator">|</span>
                    <span class="summaryChild">EPE</span>
                    <span class="seperator">|</span>
                    <span class="summaryChild">Median</span>
                </div>
    
                <div class="overallHistory">
                    <div class="columnWrap" style="width: 33.33%;">
                        {#if recordHistory}
                            <DataTable class="historyTable">
                                <Head>
                                    <Row>                        
                                        <Cell class="header" colspan=4>Overall Record</Cell>
                                    </Row>
                                    <Row>                        
                                        <Cell class="header">Win %</Cell>
                                        <Cell class="header">W</Cell>
                                        {#if recordHistory.showTies} 
                                            <Cell class="header">T</Cell>
                                        {/if}
                                        <Cell class="header">L</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    <Row>
                                        <Cell class="header">{round(recordHistory.winPerc)}</Cell>
                                        <Cell class="header">{recordHistory.wins}</Cell>
                                        {#if recordHistory.showTies} 
                                            <Cell class="header">{recordHistory.ties}</Cell>
                                        {/if}
                                        <Cell class="header">{recordHistory.losses}</Cell>
                                    </Row>
                                </Body>
                            </DataTable>
                        {/if}
                        {#if fptsHistory}
                            <DataTable class="historyTable">
                                <Head>
                                    <Row>                        
                                        <Cell class="header" colspan=3>Points Record</Cell>
                                    </Row>
                                    <Row>                 
                                        <Cell class="header">PF</Cell>
                                        <Cell class="header">PA</Cell>
                                        <Cell class="header">PPG</Cell>
                                    </Row>   
                                </Head>
                                <Body>
                                    <Row>
                                        <Cell class="header">{round(fptsHistory.fpts)}</Cell>
                                        <Cell class="header">{round(fptsHistory.fptsAgainst)}</Cell>
                                        <Cell class="header">{round(fptsHistory.fptspg)}</Cell>
                                    </Row>
                                </Body>
                            </DataTable>
                        {/if}
                    </div>
                    <div class="columnWrap" style="width: 33.33%;">
                        {#if epeHistory}
                            <DataTable class="historyTable">
                                <Head>
                                    <Row>                        
                                        <Cell class="header" colspan=4>EPE Record</Cell>
                                    </Row>
                                    <Row>                        
                                        <Cell class="header">Win %</Cell>
                                        <Cell class="header">W</Cell>
                                        {#if epeHistory.showTies} 
                                            <Cell class="header">T</Cell>
                                        {/if}
                                        <Cell class="header">L</Cell>
                                    </Row>
                                </Head>
                                <Body>
                                    <Row>
                                        <Cell class="header">{round(epeHistory.epePerc)}</Cell>
                                        <Cell class="header">{epeHistory.wins}</Cell>
                                        {#if epeHistory.showTies} 
                                            <Cell class="header">{epeHistory.ties}</Cell>
                                        {/if}
                                        <Cell class="header">{epeHistory.losses}</Cell>
                                    </Row>
                                </Body>
                            </DataTable>
                        {/if}
                    </div>
                    <div class="columnWrap" style="width: 33.33%;">
                        {#if medianHistory}
                            <DataTable class="historyTable">
                                <Head>
                                    <Row>                        
                                        <Cell class="header" colspan=6>Median Record</Cell>
                                    </Row>
                                    <Row>                 
                                        <Cell class="header">Win %</Cell>
                                        <Cell class="header">W</Cell>
                                        {#if medianHistory.showTies} 
                                            <Cell class="header">T</Cell>
                                        {/if}
                                        <Cell class="header">L</Cell>
                                        <Cell class="header">Top</Cell>
                                        <Cell class="header">Bot.</Cell>
                                    </Row>   
                                </Head>
                                <Body>
                                    <Row>
                                        <Cell class="header">{round(medianHistory.medianPerc)}</Cell>
                                        <Cell class="header">{medianHistory.wins}</Cell>
                                        {#if medianHistory.showTies} 
                                            <Cell class="header">{medianHistory.ties}</Cell>
                                        {/if}
                                        <Cell class="header">{medianHistory.losses}</Cell>
                                        <Cell class="header">{medianHistory.topScores}</Cell>
                                        <Cell class="header">{medianHistory.bottomScores}</Cell>
                                    </Row>
                                </Body>
                            </DataTable>
                        {/if}
                    </div>
                </div>
            </div>
            <div class="columnWrap">
                <div class="rosterContainer">
                    {#if loading}
                    <!-- promise is pending -->
                    <div class="loading">
                        <p>Retrieving players...</p>
                        <LinearProgress indeterminate />
                    </div>
                    {:else}
                        {#if showRoster == true}
                            <Roster division="1" expanded={false} {rosterPositions} {roster} {users} {players} {startersAndReserve} />
                        {/if}
                    {/if}
                </div>
            </div>
        </div>
    </div>

    <!-- <div class="managerConstrained">
        <p class="bio">{@html viewManager.bio}</p>

        {#if viewManager.philosophy}
            philosophy is an optional field
            <h3>Team Philosophy</h3>
            <p class="philosophy">{@html viewManager.philosophy}</p>
        {/if}
    </div> -->
    <div class="managerConstrained">
        {#if !loading}
            <!-- Favorite player -->
            <ManagerFantasyInfo {viewManager} {players} />
        {/if}

        <ManagerAwards {recordManID} {awards} {records} {roster} />

        <!-- {#if loading}
            Loading positions records...
        {:else}
        {/if} -->

        <PlayerTable {recordManID} {firstYear} {currentYear} {managerRecords} />
    </div>

    <!-- UNDER CONSTRUCTION: dynamic tree map of fantasy points by NFL team -->
    <div class="managerConstrained" style="min-height: auto">
        {#if loading}
            Loading positions records...
        {:else}
            <PancakeTable {positionsInfo} />
        {/if}
    </div>

    <h3>Team Transactions</h3>
    <div class="managerConstrained" bind:this={el}>
        {#if loading}
            <!-- promise is pending -->
            <div class="loading">
                <p>Retrieving players...</p>
                <LinearProgress indeterminate />
            </div>
        {:else}
            <TransactionsPage {playersInfo} transactions={teamTransactions} {currentManagers} {masterOffset} show='both' query='' page={0} perPage={5} />
        {/if}
    </div>

    <div class="managerNav">
        <Group variant="outlined">
            {#if manager == 0}
                <Button disabled class="selectionButtons" on:click={() => changeManager(parseInt(manager) - 1)} variant="outlined">
                    <Label>Previous Manager</Label>
                </Button>
            {:else}
                <Button class="selectionButtons" on:click={() => changeManager(parseInt(manager) - 1)} variant="outlined">
                    <Label>Previous Manager</Label>
                </Button>
            {/if}
            <Button class="selectionButtons" on:click={() => goto('/managers')} variant="outlined">
                <Label>All Managers</Label>
            </Button>
            {#if manager == managers.length - 1}
                <Button disabled class="selectionButtons" on:click={() => changeManager(parseInt(manager) + 1)} variant="outlined">
                    <Label>Next Manager</Label>
                </Button>
            {:else}
                <Button class="selectionButtons" on:click={() => changeManager(parseInt(manager) + 1)} variant="outlined">
                    <Label>Next Manager</Label>
                </Button>
            {/if}
        </Group>
    </div>

</div>