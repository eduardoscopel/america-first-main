import {
	waitForAll,
	getLeagueUsers,
	getLeagueRosters,
	getNflState,
	leagueID,
	managers,
	getLeagueData } from '$lib/utils/helper';
import { get } from 'svelte/store';
import {standingsStore} from '$lib/stores';

export const getLeagueStandings = async () => {
	if(get(standingsStore).matchupWeeks) {
		return get(standingsStore);
	}

	const [nflState, leagueData, rosters] = await waitForAll(
		getNflState(),
		getLeagueData(leagueID),
		getLeagueRosters(leagueID),
	).catch((err) => { console.error(err); });

	const yearData = leagueData.season;
	const regularSeasonLength = leagueData.settings.playoff_week_start - 1;
	let medianMatch = false;
	if(leagueData.settings.league_average_match == 1) {
		medianMatch = true;
	}
	const yearManagers = {};
	for(const managerID in managers) {
		const manager = managers[managerID];
		const year = parseInt(yearData);
		if(manager.yearsactive.includes(year)) {
			yearManagers[manager.roster] = {
				managerID: manager.managerID,
				rosterID: manager.roster,
				name: manager.name,
				status: manager.status,
				yearsactive: manager.yearsactive,
			}
		}
	}

	// if the season hasn't started, standings can't be created
	if(leagueData.status != "in_season" && leagueData.status != "post_season" && leagueData.status != "complete") return null;

	let week = 0;
	if(nflState.season_type == 'regular') {
		// max the week out at end of regular season
		week = nflState.display_week > regularSeasonLength ? regularSeasonLength + 1 : nflState.display_week;
	} else if(nflState.season_type == 'post') {
		week = regularSeasonLength + 1;
	}

	// if at least one week hasn't been completed, then standings can't be created
	if(week < 2) return null;
	

	// pull in all matchup data for the season
	const matchupsPromises = [];
	for(let i = week - 1; i > 0; i--) {
		matchupsPromises.push(fetch(`https://api.sleeper.app/v1/league/${leagueID}/matchups/${i}`, {compress: true}))
	}
	const matchupsRes = await waitForAll(...matchupsPromises);

	// convert the json matchup responses
	const matchupsJsonPromises = [];
	for(const matchupRes of matchupsRes) {
		const data = matchupRes.json(); 
		matchupsJsonPromises.push(data)
		if (!matchupRes.ok) throw new Error(data);
	}
	const matchupsData = await waitForAll(...matchupsJsonPromises).catch((err) => { console.error(err); }).catch((err) => { console.error(err); });

	let standings = {};
	// process all the matchups
	for(const matchup of matchupsData) {
		standings = processStandings(matchup, standings, rosters.rosters, medianMatch, yearManagers);
	}

	const response = {
		standingsInfo: standings,
		rostersData: rosters.rosters,
		yearData,
		medianMatch,
	}
	
	standingsStore.update(() => response);

	return response;
}

export const processStandings = (matchup, standingsData, rosters, medianMatch, yearManagers) => {
	const matchups = {};
	let scoresArray = [];
	for(const match of matchup) {
		if(!matchups[match.matchup_id]) {
			matchups[match.matchup_id] = [];
		}
		const rosterID = match.roster_id;

		// build the standings object if this is the first time the roster ID is seen
		if(!standingsData[rosterID]) {
			standingsData[rosterID] = {
				rosterID,
				recordManID: yearManagers[rosterID].managerID,
				wins: 0,
				losses: 0,
				ties: 0,
				divisionWins: rosters[rosterID - 1].settings.division ? 0 : null,
				divisionLosses: rosters[rosterID - 1].settings.division ? 0 : null,
				divisionTies: rosters[rosterID - 1].settings.division ? 0 : null,
			}
		}

		matchups[match.matchup_id].push({
			rosterID,
			division: rosters[rosterID - 1].settings.division,
			points: match.points,
		})

		if(medianMatch == true){
			scoresArray.push(match.points);
		}
	}
	// calculating median score for the week
	let medianScore;
	if(medianMatch == true){
		const numManagers = scoresArray.length;
		scoresArray = scoresArray.sort((a, b) => b - a).slice(numManagers / 2 - 1, numManagers / 2 + 1);
		medianScore = (scoresArray[0] + scoresArray[1]) / 2;
	}

	for(const matchupKey in matchups) {
		const teamA = matchups[matchupKey][0];
		const teamB = matchups[matchupKey][1];

	
		const divisionMatchup = teamA.division && teamB.division &&teamA.division == teamB.division;

		// league average match
		if(medianMatch == true) {
			for(let i = 0; i < 2; i++) {
				if(matchups[matchupKey][i].points > medianScore) {
					standingsData[matchups[matchupKey][i].rosterID].wins ++;
				} else if(matchups[matchupKey][i].points < medianScore) {
					standingsData[matchups[matchupKey][i].rosterID].losses ++;
				} else if(matchups[matchupKey][i].points == medianScore) {
					standingsData[matchups[matchupKey][i].rosterID].ties ++;
				}
			}
		}

		if(teamA.points > teamB.points) {
			standingsData[teamA.rosterID].wins ++;
			standingsData[teamB.rosterID].losses ++;
			if(divisionMatchup) {
				standingsData[teamA.rosterID].divisionWins ++;
				standingsData[teamB.rosterID].divisionLosses ++;
			}
			continue;
		} else if(teamB.points > teamA.points) {
			standingsData[teamB.rosterID].wins ++;
			standingsData[teamA.rosterID].losses ++;
			if(divisionMatchup) {
				standingsData[teamB.rosterID].divisionWins ++;
				standingsData[teamA.rosterID].divisionLosses ++;
			}
			continue;
		}
		// if neither team was greater, matchup was a draw
		standingsData[teamA.rosterID].ties ++;
		standingsData[teamB.rosterID].ties ++;
		if(divisionMatchup) {
			standingsData[teamA.rosterID].divisionTies ++;
			standingsData[teamB.rosterID].divisionTies ++;
		}
	}
	return standingsData;
}
