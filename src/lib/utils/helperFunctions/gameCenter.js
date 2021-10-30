import { leagueID, managers } from '$lib/utils/leagueInfo';
import { nflTeams, getLeagueData, getLeagueUsers, getLeagueRosters, getNflState, getLeagueMatchups, waitForAll, loadPlayers } from '$lib/utils/helper';
import { get } from 'svelte/store';
import {scoreboardStore} from '$lib/stores';

export const getNflScoreboard = async () => {
	if(get(scoreboardStore).nflWeek) {
		return get(scoreboardStore);
	}

    let nflWeek = [];
    const nflState = await getNflState().catch((err) => { console.error(err); });
    const week = nflState.week;

    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    const scoreboardPromises = [];
    scoreboardPromises.push(fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`, {compress: true}));

    const scoreboardsRes = await waitForAll(...scoreboardPromises).catch((err) => { console.error(err); });

    const scoreboardJsonPromises = [];
    for(const scoreboardRes of scoreboardsRes) {
        const data = scoreboardRes.json();
        scoreboardJsonPromises.push(data)
        if (!scoreboardRes.ok) {
            throw new Error(data);
        }
    }
    const scoreboardsData = await waitForAll(...scoreboardJsonPromises).catch((err) => { console.error(err); });
    const getSleeperID = (searchID) => {
        let sleeperID;
        for(const key in nflTeams) {
            if(nflTeams[key].espnID == searchID) {
                sleeperID = key;
            }
        }
        return sleeperID;
    }
    // const getKickoff = (date) => {
    //     const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    //     let now = new Date();
    //     let today = days[now.getDay()];
    //     let todayDate = now.getDate();

    //     let calYear = date.slice(0, 4);
    //     let calMonth = date.slice(5, 7);
    //     let calDay = date.slice(8, 10);
    //     let time = date.slice(11, 16);
    // }
    // let testdate = "2021-10-29T00:20Z";
    // let test = getKickoff(testdate);
    const nflGames = scoreboardsData[0].events;
    let gameInfo = {};

    for(const key in nflGames) {
        const nflGame = nflGames[key];
        if(!gameInfo[nflGame.id]) {
            gameInfo[nflGame.id] = [];
        }
        for(let i = 0; i < 2; i++) {
            let team = nflGame.competitions[0].competitors[i];
            let sleeperID = getSleeperID(team.id);

            const teamEntry = {
                team: nflTeams[sleeperID],
                sleeperID,
                score: team.score,
                homeAway: team.homeAway,
                record: team.records[0].summary,
                gameID: nflGame.id,
                status: nflGame.status,
                weather: nflGame.weather,
            };
            gameInfo[nflGame.id].push(teamEntry);
        }
        nflWeek.push(gameInfo[nflGame.id]);
    }

    const scoreboardData = {
        nflWeek,
        week,
    }

    scoreboardStore.update(() => scoreboardData);

    return scoreboardData;
}