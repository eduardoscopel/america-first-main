<script>
    import { getNflScoreboard, managers } from '$lib/utils/helper'; 
    import Scoreboard from './Scoreboard.svelte';
    import GameBox from './GameBox.svelte';


    export let leagueData, rosterData, users, playersInfo, nflWeek, matchupsInfo;

    let gameSelection = nflWeek.nflWeek[0][0].gameID;
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
    const managerInfo = {};
    for(const key in rosterData.rosters) {
        const roster = rosterData.rosters[key];
        const rosterID = roster.roster_id;
		const user = users[roster.owner_id];

        let recordManager = leagueManagers[rosterID].filter(m => m.yearsactive.includes(year));
		let recordManID = recordManager[0].managerID;

        if(user) {
            managerInfo[recordManID] = {
                avatar: `https://sleepercdn.com/avatars/thumbs/${user.avatar}`,
                name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
                realname: recordManager[0].name,
            };
        } else {
            managerInfo[recordManID] = {
                avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
                name: 'Unknown Manager',
                realname: 'John Q. Rando',
            };
        }

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
        background-color: var(--f3f3f3);
        display: flex;
        align-items: baseline;
    }

    .scoreboard {
        position: relative;
        display: inline-flex;
        width: 287px;
        flex-direction: column;
    }

    .gameBox {
        display: inline-flex;
    }
</style>

<div class="mainWrapper">
    <div class="mainConstrained">
        <div class="scoreboard">
            <Scoreboard {nflMatchups} {week} bind:gameSelection={gameSelection} />
        </div>
        <div class="gameBox">
            <GameBox {nflMatchups} {leagueData} {playersInfo} {fantasyStarters} {managerInfo} bind:gameSelection={gameSelection} />
        </div>
    </div>
</div>
