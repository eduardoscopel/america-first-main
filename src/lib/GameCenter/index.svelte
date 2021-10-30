<script>
    import { getNflScoreboard, managers } from '$lib/utils/helper'; 
    import Scoreboard from './Scoreboard.svelte';
    import GameBox from './GameBox.svelte';


    export let leagueData, rosterData, users, playersInfo, nflWeek, matchupsInfo;

    let gameSelection;
    let leagueManagers = {};
    const year = parseInt(leagueData.season);

    for(const managerID in managers) {
		const manager = managers[managerID];

		const entryMan = {
			managerID: manager.managerID,
			rosterID: manager.roster,
			name: manager.name,
			status: manager.status,
			yearsactive: manager.yearsactive,
		}

		if(!leagueManagers[manager.roster]) {
			leagueManagers[manager.roster] = [];
		}
		leagueManagers[manager.roster].push(entryMan);
	}

    let fantasyStarters = {};
    for(const key in rosterData.rosters) {
        const roster = rosterData.rosters[key];
        const rosterID = roster.roster_id;

        let recordManager = leagueManagers[rosterID].filter(m => m.yearsactive.includes(year));
		let recordManID = recordManager[0].managerID;

        fantasyStarters[recordManID] = roster.starters;
    }

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

    .scoreboard {
        position: relative;
        left: 0;
    }

    .gameBox {
        position: relative;
        left: 20em;
        top: 0em;
        vertical-align: top;
    }
</style>

<div class="mainWrapper">
    <div class="mainConstrained">
        <div class="scoreboard">
            <Scoreboard {nflMatchups} {week} bind:gameSelection={gameSelection} />
        </div>
        <div class="gameBox">
            <GameBox {nflMatchups} {leagueData} {playersInfo} {fantasyStarters} bind:gameSelection={gameSelection} />
        </div>
    </div>
</div>
