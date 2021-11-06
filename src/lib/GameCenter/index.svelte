<script>
    import { getNflScoreboard, managers, nflTeams } from '$lib/utils/helper'; 
    import Scoreboard from './Scoreboard.svelte';
    import PlayByPlay from './PlayByPlay.svelte';
    import GameBox from './GameBox.svelte';


    export let leagueData, rosterData, users, playersInfo, nflWeek, matchupsInfo;

    let fantasyProducts = [];
    let gameSelection = nflWeek.nflWeek[0][0].gameID;
    let nflMatchups = nflWeek.nflWeek;
    let week = nflWeek.week;

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

    const managerInfo = {};
    let fantasyStarters = {};
    let positionLeaders = {};
    let weekMatchups = matchupsInfo.matchupWeeks[matchupsInfo.week - 1].matchups;
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
        // get starters
        for(const matchup in weekMatchups) {
            const match = weekMatchups[matchup];
            for(const managerKey in match) {
                const managerWeek = match[managerKey];
                if(managerWeek.recordManID == recordManID) {
                    fantasyStarters[recordManID] = managerWeek.starters;
                }
            }
        }
    }
    //get position leaders
    for(const matchup in weekMatchups) {
        const match = weekMatchups[matchup];
        for(const managerKey in match) {
            const managerWeek = match[managerKey];
            for(let i = 0; i < managerWeek.starters.length; i++) {
                if(managerWeek.starters[i] == '0') {
                    continue;
                } else {
                    if(!positionLeaders[playersInfo.players[managerWeek.starters[i]].pos]) {
                        positionLeaders[playersInfo.players[managerWeek.starters[i]].pos] = [];
                    }
                    const entry = {
                        playerID: managerWeek.starters[i],
                        pos: playersInfo.players[managerWeek.starters[i]].pos,
                        fpts: managerWeek.points[i],
                        manager: managerWeek.manager,
                        recordManID: managerWeek.recordManID,
                        playerInfo: playersInfo.players[managerWeek.starters[i]],
                        avatar: playersInfo.players[managerWeek.starters[i]].pos == "DEF" ? `https://sleepercdn.com/images/team_logos/nfl/${managerWeek.starters[i].toLowerCase()}.png` : `https://sleepercdn.com/content/nfl/players/thumb/${managerWeek.starters[i]}.jpg`,
                        teamAvatar: `https://sleepercdn.com/images/team_logos/nfl/${playersInfo.players[managerWeek.starters[i]].t.toLowerCase()}.png`,
                        teamColor: `background-color: #${nflTeams[playersInfo.players[managerWeek.starters[i]].t].color}6b`,
                        teamAltColor: `background-color: #${nflTeams[playersInfo.players[managerWeek.starters[i]].t].alternateColor}52`,
                    }
                    positionLeaders[playersInfo.players[managerWeek.starters[i]].pos].push(entry);
                }
            }
        }
    }
    // sort position leaders
    for(const key in positionLeaders) {
        positionLeaders[key] = positionLeaders[key].sort((a, b) => b.fpts - a.fpts);
    }
</script>

<style>
    .mainWrapper {
        width: 100%;
        position: relative;
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        align-content: center;
    }

    .mainConstrained {
        width: 100%;
        max-width: 1500px;
        margin: 0 auto 4em;
        background-color: var(--f3f3f3);
        display: inline-flex;
        align-items: baseline;
        align-content: center;
        position: relative;
    }

    .scoreboard {
        position: relative;
        display: inline-flex;
        width: 287px;
        flex-direction: column;
    }

    .centerWrapper {
        display: inline-flex;
        flex-direction: column;
        position:relative;
        width: 63%;
        margin: auto;
        align-content: center;
        align-self: center;
        align-items: center;
        justify-content: center;
    }

    .gameBox {
        display: inline-flex;
        flex-direction: column;
        width: 100%;
        position: relative;
        align-items: center;
        justify-content: center;
        align-content: center;
        align-self: center;
    }

    .playByPlay {
        display: inline-flex;
        flex-direction: column;
        position: relative;
        align-items: center;
    }
</style>

<div class="mainWrapper">
    <div class="mainConstrained">
        <div class="scoreboard">
            <Scoreboard {nflMatchups} {week} bind:gameSelection={gameSelection} />
        </div>
        <div class="centerWrapper">
            <div class="gameBox">
                <GameBox {nflTeams} {nflMatchups} {leagueData} {playersInfo} {fantasyStarters} {positionLeaders} {managerInfo} bind:fantasyProducts={fantasyProducts} bind:gameSelection={gameSelection} />
            </div>
            <div class="playByPlay">
                <PlayByPlay {nflTeams} {nflMatchups} {leagueData} {playersInfo} {fantasyStarters} {managerInfo} bind:fantasyProducts={fantasyProducts} bind:gameSelection={gameSelection} />
            </div>
        </div>
    </div>
</div>
