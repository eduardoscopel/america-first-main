<script context="module">
	import { getNflScoreboard, getLeagueRosters, getLeagueUsers, getLeagueData, getLeagueMatchups, loadPlayers, waitForAll } from '$lib/utils/helper';

    export async function load() {
        const scoreboardInfo = waitForAll(
            getLeagueRosters(),    
            getLeagueUsers(),
            getLeagueData(),
            getNflScoreboard(),
            getLeagueMatchups(),
            loadPlayers(),
        );
		return {
			props: {
				scoreboardInfo,
			}
		};
	}
</script>

<script>
    import LinearProgress from '@smui/linear-progress';
	import { GameCenter } from '$lib/components';

    export let scoreboardInfo;
</script>

<style>
	.holder {
		position: relative;
		z-index: 1;
	}
	.loading {
		display: block;
		width: 85%;
		max-width: 500px;
		margin: 80px auto;
	}
</style>

<div class="holder">
	{#await scoreboardInfo}
		<div class="loading">
			<p>Retrieving games data...</p>
			<br />
			<LinearProgress indeterminate />
		</div>
	{:then [rosterData, users, leagueData, nflWeek, matchupsInfo, playersInfo]}
		<!-- promise was fulfilled -->
		<GameCenter {rosterData} {users} {leagueData} {nflWeek} {matchupsInfo} {playersInfo} /> 
	{:catch error}
		<!-- promise was rejected -->
		<p>Something went wrong: {error.message}</p>
	{/await}
</div>