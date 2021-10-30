<script>
    import { getNflScoreboard } from '$lib/utils/helper'; 
    import Scoreboard from './Scoreboard.svelte';

    export let leagueData, rosterData, users, playersInfo, nflWeek, matchupsInfo;

    let nflMatchups = nflWeek.nflWeek;
    let week = nflWeek.week;

</script>

<style>
    .mainWrapper {
        width: 100%;
    }

    .mainConstrained {
        width: 97%;
        max-width: 1500px;
        margin: 0 auto 4em;
    }
</style>

<div class="mainWrapper">
    <div class="mainConstrained">
        <Scoreboard {nflMatchups} {week} />
    </div>
</div>
