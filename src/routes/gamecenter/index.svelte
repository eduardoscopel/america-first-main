<script context="module">
	import { getNflScoreboard, getYearMatchups, getLeagueStandings, loadPlayers, waitForAll, nflPlayerInfo } from '$lib/utils/helper';

    export async function load() {
        const scoreboardInfo = waitForAll(
            getNflScoreboard(),
            getYearMatchups(),
			getLeagueStandings(),
            loadPlayers(),
        );
		return {
			props: {
				scoreboardInfo,
				nflPlayerInfo,
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
	{:then [nflWeek, matchupsInfo, standingsData, playersInfo]}
		<!-- promise was fulfilled -->
		<GameCenter {nflWeek} {matchupsInfo} {standingsData} {playersInfo} {nflPlayerInfo} /> 
	{:catch error}
		<!-- promise was rejected -->
		<p>Something went wrong: {error.message}</p>
	{/await}
</div>