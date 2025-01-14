<script>
    import BarChart from '$lib/BarChart.svelte';
    import { generateGraph, round, predictScores, loadPlayers } from '$lib/utils/helper';
    import { managers } from '$lib/utils/leagueInfo';
    export let nflState, rostersData, users, playersInfo, leagueData;

    const rosters = rostersData.rosters;

    const currentManagers = {};
    const activeManagers = {};

	for(const managerID in managers) {
		const manager = managers[managerID];

        if(manager.status == 'active') {
			activeManagers[manager.roster] = {
                managerID: manager.managerID,
                rosterID: manager.roster,
                name: manager.name,
            };
		}
	}

    for(const roster of rosters) {
        const user = users[roster.owner_id];
        const rosterID = roster.roster_id;
        const recordManager = activeManagers[rosterID];
        const recordManID = recordManager.managerID;

        currentManagers[recordManID] = {
            avatar: user.avatar != null ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : `https://sleepercdn.com/images/v2/icons/player_default.webp`,
            name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
            realname: recordManager.name,
        }
    }

    let validGraph = false;

    let graphsObj = {
        powerRankings: {
            Overall: {

            }
        }
    }
;
    const buildRankings = () => {
        const rosterPowers = [];
        let week = nflState.week;
        if(week == 0) {
            week = 1;
        }
        let max = 0;

        for(const roster of rosters) {

            const recordManID = activeManagers[roster.roster_id].managerID;
            // make sure the roster has players on it
            if(!roster.players) continue;
            // if at least one team has players, create the graph
            validGraph = true;

            const rosterPlayers = [];

            for(const rosterPlayer of roster.players) {
                rosterPlayers.push({
                    name: players[rosterPlayer].ln,
                    pos: players[rosterPlayer].pos,
                    wi: players[rosterPlayer].wi
                })
            }

            const rosterPower = {
                rosterID: roster.roster_id,
                recordManID,
                manager: currentManagers[recordManID],
                powerScore: 0,
            }
            const seasonEnd = 18;
            for(let i = week; i < seasonEnd; i++) {
                rosterPower.powerScore += predictScores(rosterPlayers, i, leagueData);
            }
            if(rosterPower.powerScore > max) {
                max = rosterPower.powerScore;
            }
            rosterPowers.push(rosterPower);
        }

        for(const rosterPower of rosterPowers) {
            rosterPower.powerScore = round(rosterPower.powerScore/max * 100);
        }

        const powerGraph = {
            stats: rosterPowers,
            x: "Manager",
            y: "Power Ranking",
            stat: "",
            header: "Rest of Season Power Rankings",
            field: "powerScore",
            short: "ROS Power Ranking"
        };

        graphsObj.powerRankings.Overall.graph = generateGraph(powerGraph, 10);
        
    }

    let players = playersInfo.players;

    buildRankings();

    const refreshPlayers = async () => {
        const newPlayersInfo = await loadPlayers(true);
        players = newPlayersInfo.players;
        buildRankings();
    }

    if(playersInfo.stale) {
        refreshPlayers();
    }

    let el;
    let maxWidth = 620;


    const resize = (w) => {
        const left = el?.getBoundingClientRect() ? el?.getBoundingClientRect().left  : 0;
        const right = el?.getBoundingClientRect() ? el?.getBoundingClientRect().right  : 0;

        maxWidth = right - left;
    }
    let innerWidth;

    $: resize(innerWidth);

    let curSort = {
        sort: 'graph',
        inverted: false,
    };

</script>

<svelte:window bind:innerWidth={innerWidth} />

<style>
    .enclosure {
        display: block;
        position: relative;
        width: 100%;
    }
</style>

{#if validGraph}
    <div class="enclosure" bind:this={el}>
        <BarChart {maxWidth} {graphsObj} {curSort} />
    </div>
{/if}