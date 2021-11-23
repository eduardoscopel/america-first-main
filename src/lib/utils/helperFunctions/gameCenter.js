import { leagueID, managers } from '$lib/utils/leagueInfo';
import { nflTeams, getLeagueData, getLeagueUsers, getLeagueRosters, getNflState, getLeagueMatchups, waitForAll, loadPlayers } from '$lib/utils/helper';
import { get } from 'svelte/store';
import { leagueData, scoreboardStore } from '$lib/stores';

export const getPlayByPlay = async (gameID) => {

    let fullPlayByPlay;

    const playbyplayPromises = [];
    playbyplayPromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameID}/competitions/${gameID}/plays?lang=en&region=us`, {compress: true}));

    const playbyplaysRes = await waitForAll(...playbyplayPromises).catch((err) => { console.error(err); });

    const playbyplayJsonPromises = [];
    for(const playbyplayRes of playbyplaysRes) {
        const data = playbyplayRes.json();
        playbyplayJsonPromises.push(data)
        if (!playbyplayRes.ok) {
            throw new Error(data);
        }
    }
    const playbyplaysData = await waitForAll(...playbyplayJsonPromises).catch((err) => { console.error(err); });

    let pageCount = playbyplaysData[0].pageCount;
    if(pageCount > 1) {
        const pagePromises = [];
        for(let i = 1; i < pageCount + 1; i++) {
            pagePromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameID}/competitions/${gameID}/plays?lang=en&region=us&page=${i}`, {compress: true}));
        }

        const pagesRes = await waitForAll(...pagePromises).catch((err) => { console.error(err); });

        const pageJsonPromises = [];
        for(const pageRes of pagesRes) {
            const data = pageRes.json();
            pageJsonPromises.push(data)
            if (!pageRes.ok) {
                throw new Error(data);
            }
        }
        const pagesData = await waitForAll(...pageJsonPromises).catch((err) => { console.error(err); });
        fullPlayByPlay = pagesData;
    } else {
        fullPlayByPlay = playbyplaysData;
    }
    return fullPlayByPlay;
}

export const getGameDrives = async (gameID) => {

    let fullDrives;

    const drivesPromises = [];
    drivesPromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameID}/competitions/${gameID}/drives?lang=en&region=us`, {compress: true}));

    const drivesRes = await waitForAll(...drivesPromises).catch((err) => { console.error(err); });

    const drivesJsonPromises = [];
    for(const driveRes of drivesRes) {
        const data = driveRes.json();
        drivesJsonPromises.push(data)
        if (!driveRes.ok) {
            throw new Error(data);
        }
    }
    const drivesData = await waitForAll(...drivesJsonPromises).catch((err) => { console.error(err); });

    let pageCount = drivesData[0].pageCount;
    if(pageCount > 1) {
        const pagePromises = [];
        for(let i = 1; i < pageCount + 1; i++) {
            pagePromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/${gameID}/competitions/${gameID}/drives?lang=en&region=us&page=${i}`, {compress: true}));
        }

        const pagesRes = await waitForAll(...pagePromises).catch((err) => { console.error(err); });

        const pageJsonPromises = [];
        for(const pageRes of pagesRes) {
            const data = pageRes.json();
            pageJsonPromises.push(data)
            if (!pageRes.ok) {
                throw new Error(data);
            }
        }
        const pagesData = await waitForAll(...pageJsonPromises).catch((err) => { console.error(err); });
        fullDrives = pagesData;
    } else {
        fullDrives = drivesData;
    }
    return fullDrives;
}

let yearSelection = null;
let weekSelection = null;
let newWeekSelection = null;
let newYearSelection = null;

export const getNflScoreboard = async (yearSelection, weekSelection) => {

	if(newYearSelection == yearSelection && newWeekSelection == weekSelection && get(scoreboardStore).nflWeek) {
		return get(scoreboardStore);
	}

    const nflState = await getNflState().catch((err) => { console.error(err); });
    const week = nflState.week;
    const year = parseInt(nflState.season);

    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks/11/events?lang=en&region=us ALL GAMES GIVEN WEEK

    const scoreboardData = {
        nflWeek: [],
        week: week,
    }

    if(yearSelection == null) {
        yearSelection = year;
    }
    if(weekSelection == null) {
        weekSelection = week;
    }


    if(yearSelection == year && weekSelection == week) {

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
            scoreboardData.nflWeek.push(gameInfo[nflGame.id]);
        }
    } else {

        const weekGamesPromises = [];
        if((yearSelection >= 2021 && weekSelection < 18) || (yearSelection < 2021 && weekSelection < 17)) {
            weekGamesPromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${yearSelection}/types/2/weeks/${weekSelection}/events?lang=en&region=us`, {compress: true}));
        } else {
            let adjustedWeekSelection;
            if(yearSelection >= 2021 && weekSelection != 21) {
                adjustedWeekSelection = weekSelection - 17;
            } else if(yearSelection >= 2021 && weekSelection == 21) {
                adjustedWeekSelection = 5;
            }
            weekGamesPromises.push(fetch(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${yearSelection}/types/3/weeks/${adjustedWeekSelection}/events?lang=en&region=us`, {compress: true}));
        }

        const weekGamesRes = await waitForAll(...weekGamesPromises).catch((err) => { console.error(err); });
        const weekGameJsonPromises = [];
        for(const weekGameRes of weekGamesRes) {
            const data = weekGameRes.json();
            weekGameJsonPromises.push(data)
            if (!weekGameRes.ok) {
                throw new Error(data);
            }
        }
        const weekGamesData = await waitForAll(...weekGameJsonPromises).catch((err) => { console.error(err); });

        const gamesPromises = [];
        for(const gameData in weekGamesData[0].items) {
            gamesPromises.push(fetch(`${weekGamesData[0].items[gameData].$ref}`))
        }

        const gamesRes = await waitForAll(...gamesPromises).catch((err) => { console.error(err); });
        const gameJsonPromises = [];
        for(const gameRes of gamesRes) {
            const data = gameRes.json();
            gameJsonPromises.push(data)
            if (!gameRes.ok) {
                throw new Error(data);
            }
        }
        const gamesData = await waitForAll(...gameJsonPromises).catch((err) => { console.error(err); });


        const getSleeperID = (searchID) => {
            let sleeperID;
            for(const key in nflTeams) {
                if(nflTeams[key].espnID == searchID) {
                    sleeperID = key;
                }
            }
            return sleeperID;
        }

        const getScore = async (scoreLink) => {
            const secureScoreLink = 'https' + scoreLink.slice(4); 
            const scoresPromises = [];
            scoresPromises.push(fetch(`${secureScoreLink}`, {compress: true}));
            const scoresRes = await waitForAll(...scoresPromises).catch((err) => { console.error(err); });
            const scoreJsonPromises = [];
            for(const scoreRes of scoresRes) {
                const data = scoreRes.json();
                scoreJsonPromises.push(data)
                if (!scoreRes.ok) {
                    throw new Error(data);
                }
            }
            const scoreData = await waitForAll(...scoreJsonPromises).catch((err) => { console.error(err); });
            let score = scoreData[0].value;
            return score;
        }

        const getStatus = async (statusLink) => {
            const secureStatusLink = 'https' + statusLink.slice(4); 
            const statusPromises = [];
            statusPromises.push(fetch(`${secureStatusLink}`, {compress: true}));
            const statusRes = await waitForAll(...statusPromises).catch((err) => { console.error(err); });
            const statusJsonPromises = [];
            for(const stateRes of statusRes) {
                const data = stateRes.json();
                statusJsonPromises.push(data)
                if (!stateRes.ok) {
                    throw new Error(data);
                }
            }
            const statusData = await waitForAll(...statusJsonPromises).catch((err) => { console.error(err); });
            let status = statusData[0];
            return status;
        }

        let gameInfo = {};

        for(const key in gamesData) {
            const nflGame = gamesData[key];
            if(!gameInfo[nflGame.id]) {
                gameInfo[nflGame.id] = [];
            }
            for(let i = 0; i < 2; i++) {
                let team = nflGame.competitions[0].competitors[i];
                let sleeperID = getSleeperID(team.id);

                let score = await getScore(team.score.$ref);
                let status = await getStatus(nflGame.competitions[0].status.$ref);

                const teamEntry = {
                    team: nflTeams[sleeperID],
                    sleeperID,
                    score: score,
                    homeAway: team.homeAway,
                    gameID: nflGame.id,
                    status: status,
                };
                gameInfo[nflGame.id].push(teamEntry);
            }
            scoreboardData.nflWeek.push(gameInfo[nflGame.id]);
        }
    }

    newWeekSelection = weekSelection;
    newYearSelection = yearSelection;

    scoreboardStore.update(() => scoreboardData);

    return scoreboardData;
}

let currentYear = null;
let curSeason = leagueID;
const leagueIdArray = [];
const leagueDataArray = [];
leagueIdArray.push(curSeason);

export const getYearMatchups = async (yearSelection) => {

    let matchupsData;

    const nflState = await getNflState().catch((err) => { console.error(err); });
    if(yearSelection == null) {
        yearSelection = parseInt(nflState.season);
        currentYear = yearSelection;
    }

    const [currentLeagueData, currentRosterRes, currentUsers] = await waitForAll(
        getLeagueData(leagueID),
        getLeagueRosters(leagueID),
        getLeagueUsers(leagueID),
    ).catch((err) => { console.error(err); });

    if(leagueDataArray.length == 0) {
        leagueDataArray.push(currentLeagueData);
        curSeason = currentLeagueData.previous_league_id;
        leagueIdArray.push(curSeason);
    }
    
    while (curSeason && curSeason != 0) {
        let previousLeagueData = await getLeagueData(curSeason).catch((err) => { console.error(err); });
        leagueIdArray.push(previousLeagueData.previous_league_id);
        leagueDataArray.push(previousLeagueData);
        curSeason = previousLeagueData.previous_league_id;
    }

    if(yearSelection == currentYear) {
        let currentMatchupsData = await getLeagueMatchups().catch((err) => { console.error(err); });
        currentMatchupsData['yearLeagueData'] = currentLeagueData;
        currentMatchupsData['rosters'] = currentRosterRes.rosters;
        currentMatchupsData['users'] = currentUsers;
        matchupsData = currentMatchupsData;
    } else {

        const idIndex = currentYear - yearSelection;
        const yearLeagueID = leagueIdArray[idIndex];
        const yearLeagueData = leagueDataArray[idIndex];

        const [rosterRes, users] = await waitForAll(
            getLeagueRosters(yearLeagueID),
            getLeagueUsers(yearLeagueID),
        ).catch((err) => { console.error(err); });

        const rosters = rosterRes.rosters;
    
        let yearManagers = {};
        for(const managerID in managers) {
            const manager = managers[managerID];

            const entryMan = {
                managerID: manager.managerID,
                rosterID: manager.roster,
                name: manager.name,
                status: manager.status,
                yearsactive: manager.yearsactive,
                abbreviation: manager.abbreviation,
            }

            if(!yearManagers[manager.roster] && manager.yearsactive.includes(yearSelection)) {
                yearManagers[manager.roster] = [];
                yearManagers[manager.roster].push(entryMan);
            }
        }

        const regularSeasonLength = yearLeagueData.settings.playoff_week_start - 1;

        const numPOTeams = parseInt(yearLeagueData.settings.playoff_teams);
        const playoffStart = parseInt(yearLeagueData.settings.playoff_week_start);
        let playoffLength;
        let playoffType;

        // before 2020, 1 week per PO round was only option
        if(yearSelection > 2019) {
            playoffType = parseInt(yearLeagueData.settings.playoff_round_type);
        } else {
            playoffType = 0;
        }

        // calculate length of playoffs										"Relevant" Match IDs
        if(playoffType == 0) {							// 1W/r		4-team		6-team		8-team
            if(numPOTeams == 6) {						// last:	1, 2		1, 2		1, 2, 3, 4 						
                playoffLength = 3;						// 2-last:	1, 2		1, 2, 3		1, 2, 3, 4
            } else if(numPOTeams == 8) {                // 3-last:				1, 2		1, 2, 3, 4
                playoffLength = 3;
            } else if(numPOTeams == 4) {			
                playoffLength = 2;						
            }
        } else if(playoffType == 1 && year > 2020) {	// 1W/r+2c  4-team		6-team		8-team
            if(numPOTeams == 6) {						// last:	1			1			1
                playoffLength = 4;						// 2-last:	1, 2		1, 2		1, 2, 3, 4						
            } else if(numPOTeams == 8) {                // 3-last:	1, 2		1, 2, 3		1, 2, 3, 4				
                playoffLength = 4;                      // 4-last:				1, 2		1, 2, 3, 4
            } else if(numPOTeams == 4) {
                playoffLength = 3;
            }
        } else if(playoffType == 2 ||
                    playoffType == 1 && year == 2020) {	// 2W/r  	4-team		6-team		8-team
            if(numPOTeams == 6) {						// last:	1, 2		1, 2		1, 2, 3, 4	
                playoffLength = 6;						// 2-last:	1, 2		1, 2		1, 2, 3, 4							
            } else if (numPOTeams == 8) {				// 3-last:	1, 2		1, 2, 3 	1, 2, 3, 4
                playoffLength = 6;						// 4-last: 	1, 2		1, 2, 3		1, 2, 3, 4					
            } else if (numPOTeams == 4) {               // 5-last:				1, 2		1, 2, 3, 4	
                playoffLength = 4;                      // 6-last:				1, 2		1, 2, 3, 4
            }
        }


        let POrecordsWeek = playoffStart + playoffLength - 1;

        const matchupsPromises = [];

        while(POrecordsWeek > 0) {
            matchupsPromises.push(fetch(`https://api.sleeper.app/v1/league/${yearLeagueID}/matchups/${POrecordsWeek}`, {compress: true}))
            POrecordsWeek--;
        }

        const matchupsRes = await waitForAll(...matchupsPromises).catch((err) => { console.error(err); });

        // convert the json matchup responses
        const matchupsJsonPromises = [];
        for(const matchupRes of matchupsRes) {
            const data = matchupRes.json();
            matchupsJsonPromises.push(data)
            if (!matchupRes.ok) {
                throw new Error(data);
            }
        }
        const yearMatchupsData = await waitForAll(...matchupsJsonPromises).catch((err) => { console.error(err); });

        let matchupWeeks = [];
        // process all the matchups
        for(let i = 1; i < yearMatchupsData.length + 1; i++) {
            const processed = processMatchups(yearMatchupsData[i - 1], yearManagers, rosters, users, i);
            if(processed) {
                matchupWeeks.push({
                    matchups: processed.matchups,
                    week: processed.week
                });
            }
        }
        matchupWeeks = matchupWeeks.reverse();

        matchupsData = {
            matchupWeeks,
            year: yearSelection,
            week: weekSelection,
            regularSeasonLength,
            yearLeagueData,
            rosters: rosters,
            users: users,
        }
    
    }


    return matchupsData;
}

const processMatchups = (inputMatchups, yearManagers, rosters, users, week) => {
	if(!inputMatchups || inputMatchups.length == 0) {
		return false;
	}
	const matchups = {};
	for(const match of inputMatchups) {
		if(!matchups[match.matchup_id]) {
			matchups[match.matchup_id] = [];
		}
		let user = users[rosters[match.roster_id - 1].owner_id];
        let recordManager = yearManagers[match.roster_id]; 
		let recordManID = yearManagers[match.roster_id][0].managerID;

		matchups[match.matchup_id].push({
			manager: {
				name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
				avatar: user.avatar != null ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : `https://sleepercdn.com/images/v2/icons/player_default.webp`,
				realname: recordManager[0].name,
                abbreviation: recordManager[0].abbreviation,
                rosterID: match.roster_id,
                recordManID,
			},
			recordManID,
			starters: match.starters,
			points: match.starters_points,
			matchID: match.matchup_id,
			rosterID: match.roster_id,
			totalFpts: match.points,
		})
	}
	return {matchups, week};
}