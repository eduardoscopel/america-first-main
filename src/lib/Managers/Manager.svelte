<script>
    import Button, { Group, Label } from '@smui/button';
    import DataTable, { Head, Body, Row, Cell } from '@smui/data-table'; 
	import LinearProgress from '@smui/linear-progress';
    import {loadPlayers, getLeagueStandings, getNflState, getLeagueData, leagueID, round} from '$lib/utils/helper';
	import Roster from '../Rosters/Roster.svelte';
	import TransactionsPage from '../Transactions/TransactionsPage.svelte';
    import { goto } from '$app/navigation';
    import ManagerFantasyInfo from './ManagerFantasyInfo.svelte';
    import ManagerAwards from './ManagerAwards.svelte';
    import { onMount } from 'svelte';
    import PlayerTable from './PlayerTable.svelte';
    // import PancakeTable from './PancakeTable.svelte';

    export let manager, managers, rostersData, users, rosterPositions, transactions, currentManagers, awards, records;

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
    let loading = true;
    let curSeason = leagueID;
    let nflStated;
    let leagueDatum;
    let standings;
    let seasons = [];

    for(const year in records.leagueRosterRecords[recordManID].years) {
        const season = records.leagueRosterRecords[recordManID].years[year];
        let seasonEntry = {
            year: season.year,
            wins: season.wins,
            losses: season.losses,
            ties: season.ties,
            fptspg: season.fptspg,
            manager: season.manager,
            regSeasonRank: 0,
            finalRank: 0,
            showTies: new Boolean (false),
        }
        if(season.ties > 0) {
            seasonEntry.showTies = true;
        } else {
            seasonEntry.showTies = false;
        }
        seasons.push(seasonEntry);
    }

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
        loading = false;

        if(playerData.stale) {
            const newPlayerData = await loadPlayers(true);
            playersInfo = newPlayerData;
            players = newPlayerData.players;
        }
    })

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
    }

    .managerConstrained {
        width: 97%;
        max-width: 800px;
        margin: 0 auto 4em;
    }

    .managerBlock {
        position: relative;
        z-index: 1;
        width: 100%;
        min-width: 470px;
        max-width: 550px;
        min-height: 100%;
		background-color: var(--ebebeb);
        border-left: var(--eee);
		box-shadow: inset 0px 3px 3px -2px rgb(0 0 0 / 40%), inset 0px 3px 4px 0px rgb(0 0 0 / 28%), inset 0px 1px 8px 0px rgb(0 0 0 / 24%);
    }

    #managerName {
        padding: 15px 0;
		background-color: var(--f3f3f3);
        box-shadow: 5px 0 8px var(--champShadow);
        border-left: 1px solid var(--ddd);
    }

    .managerNamed {
        display: inline-block;
		background-color: var(--f3f3f3);
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 0.2em 0em 0em;
        line-height: 1em;
    }

    .teamSub {
        font-size: 0.47em;
        line-height: 1em;
        text-align: left;
        margin: 10px 0 0 0;
        color: #888;
    }

    .managerPlacement {
        display: inline-block;
		background-color: var(--f3f3f3);
        position: absolute;
        right: 0.15em;
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 0.2em 0em 0em 1.7em ;
        line-height: 1em;
    }

    .managerRecord {
        display: inline-block;
		background-color: var(--f3f3f3);
        position: absolute;
        right: 0.15em;
        text-align: left;
        vertical-align: top;
        font-size: 2em;
        margin: 2em 0em 0em 1.7em ;
        line-height: 1em;
    }

    .managerPhoto {
        display: inline-block;
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

    #historyProfile {
        padding: 4px 5px 5px 5px;
		background-color: var(--f3f3f3);
        box-shadow: 5px 0 8px var(--champShadow);
        border-left: 1px solid var(--ddd);
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

    /* :global(.historyTable tr) {
        line-height: 25px;
    } */

    .fullFlex {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
        margin: 3em auto 5em;
    }

    h2 {
        text-align: center;
        font-size: 2.8em;
        margin: 1em 0 0em;
        line-height: 1em;
    }

    h3 {
        text-align: center;
        font-size: 1.5em;
        margin: 1.5em 0 0.5em;
        font-weight: 200;
    }

    .basicInfo {
        display: flex;
        justify-content: space-evenly;
        align-items: center;
        vertical-align: center;
        height: 50px;
        margin: 0 0;
    }

    .basicInfo span {
        color: #888;
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
    </div>
    <div class="managerBlock">
        <div id="managerName">
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
            {#if showRecord}
                <div class="managerPlacement">{standingsRank}<sup>{rankSuper}</sup></div>
                <div class="managerRecord">{showTies ? '(' + wins + ' - ' + ties + ' - ' + losses + ')' : '(' + wins + ' - ' + losses + ')'}</div>
            {/if}
        </div>
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
        <div id="historyProfile">
            {#if seasons && seasons.length}
                <DataTable class="historyTable">
                    <Head>
                        <Row>                        
                            <Cell class="header" colspan=5>League History</Cell>
                        </Row>
                        <Row>                        
                            <Cell class="header">Year</Cell>
                            <Cell class="header">Team</Cell>
                            <Cell class="header">Record</Cell>
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
                                <Cell class="header">{season.regSeasonRank}</Cell>
                                <Cell class="header">{season.finalRank}</Cell>
                            </Row>
                        {/each}
                    </Body>
                </DataTable>
            {/if}
        </div>
    </div>
    <div class="managerConstrained">
        <p class="bio">{@html viewManager.bio}</p>

        {#if viewManager.philosophy}
            <!-- philosophy is an optional field -->
            <h3>Team Philosophy</h3>
            <p class="philosophy">{@html viewManager.philosophy}</p>
        {/if}
    </div>

    {#if !loading}
        <!-- Favorite player -->
        <ManagerFantasyInfo {viewManager} {players} />
    {/if}

    <ManagerAwards tookOver={viewManager.tookOver} {recordManID} {awards} {records} {roster} />

    <PlayerTable {recordManID} />

    <!-- UNDER CONSTRUCTION: dynamic tree map of fantasy points by NFL team -->
    <!-- <PancakeTable {recordManID} /> -->

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