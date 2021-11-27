import { getLeagueData } from './leagueData';
import { getLeagueRosters } from './leagueRosters';
import { getLeagueUsers } from './leagueUsers';
import {waitForAll} from './multiPromise';
import { get } from 'svelte/store';
import {awards} from '$lib/stores';
import { managers, leagueID } from '$lib/utils/leagueInfo';


export const getAwards = async () => {
	if(get(awards).podiums) {
		return get(awards);
	}
	const [rosterRes, users, leagueData] = await waitForAll(
		getLeagueRosters(leagueID),
		getLeagueUsers(leagueID),
		getLeagueData(leagueID),
	).catch((err) => { console.error(err); });

	const rosters = rosterRes.rosters;

	const currentManagers = {};

	let leagueManagers = {}; 

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

	for(const roster of rosters) {
		const user = users[roster.owner_id];

		let recordManager = leagueManagers[roster.roster_id].filter(m => m.status == "active");
		let recordManID = recordManager[0].managerID;

		if(user) {
			currentManagers[recordManID] = {
				avatar: user.avatar != null ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : `https://sleepercdn.com/images/v2/icons/player_default.webp`,
				name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
				realname: recordManager[0].name,
			}
		} else {
			currentManagers[recordManID] = {
				avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
				name: 'Unknown Manager',
				realname: 'John Q. Rando',
			}
		}
	}

	let previousSeasonID = leagueData.previous_league_id;

	const {podiums, finalRanks} = await getPodiums(previousSeasonID)

	const gatheredAwards = {
		podiums,
		finalRanks,
		currentManagers
	};

	awards.update(() => gatheredAwards);

	return gatheredAwards;
}

const getPodiums = async (previousSeasonID) => {
	const podiums = [];
	const finalRanks = [];

	while(previousSeasonID && previousSeasonID != 0) {
		// use the previous season ID to get the previous league, roster, user, and bracket data
		const previousSeasonData = await getPreviousLeagueData(previousSeasonID);

		const {
			losersData,
			winnersData,
			numPlayoffMatches,
			numToiletMatches,
			numPOTeams,
			numToiletTeams,
			losersBracketType,
			year,
			previousRosters,
			numDivisions,
			usersData,
			playoffRounds,
			toiletRounds,
			leagueMetadata,
			recordManagers,
		} = previousSeasonData;

		previousSeasonID = previousSeasonData.previousSeasonID;

		const {divisions, prevManagers} = buildDivisionsAndManagers({usersData, previousRosters, leagueMetadata, numDivisions, recordManagers});

		// add manager to division obj and convert to array
		const divisionArr = []
		for(const key in divisions) {
			divisions[key].manager = prevManagers[divisions[key].recordManID];
			divisionArr.push(divisions[key]);
		}

		let finalRank = {
			champion: null,
			second: null,
			third: null,
			fourth: null,
			5: null,
			6: null,
			7: null,
			8: null,
		}
		let toiletArray = [];
		let consolationArray = [];
		let podium = {
			year,
			champion: null,
			second: null,
			third: null,
			divisions: divisionArr,
			toilet: null,
		}
		//final ranks of playoff-bracket teams
		if(numPOTeams == 4){
			const finalsMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 1)[0];
			podium.champion = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.w)[0].managerID];
			finalRank.champion = podium.champion;
			podium.second = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.l)[0].managerID];
			finalRank.second = podium.second;

			const runnersUpMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches)[0];
			podium.third = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.w)[0].managerID];
			finalRank.third = podium.third;
			finalRank.fourth  = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.l)[0].managerID];
		} else if(numPOTeams == 6) {
			const finalsMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 1)[0];
			podium.champion = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.w)[0].managerID];
			finalRank.champion = podium.champion;
			podium.second = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.l)[0].managerID];
			finalRank.second = podium.second;

			const runnersUpMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches)[0];
			podium.third = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.w)[0].managerID];
			finalRank.third = podium.third;
			finalRank.fourth  = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.l)[0].managerID];

			const fiveSixMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 2)[0];
			finalRank[5] = prevManagers[recordManagers.filter(m => m.rosterID == fiveSixMatch.w)[0].managerID];
			finalRank[6] = prevManagers[recordManagers.filter(m => m.rosterID == fiveSixMatch.l)[0].managerID];	
		} else if(numPOTeams == 8) {
			const finalsMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 3)[0];
			podium.champion = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.w)[0].managerID];
			finalRank.champion = podium.champion;
			podium.second = prevManagers[recordManagers.filter(m => m.rosterID == finalsMatch.l)[0].managerID];
			finalRank.second = podium.second;

			const runnersUpMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 2)[0];
			podium.third = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.w)[0].managerID];
			finalRank.third = podium.third;
			finalRank.fourth  = prevManagers[recordManagers.filter(m => m.rosterID == runnersUpMatch.l)[0].managerID];

			const fiveSixMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches - 1)[0];
			finalRank[5] = prevManagers[recordManagers.filter(m => m.rosterID == fiveSixMatch.w)[0].managerID];
			finalRank[6] = prevManagers[recordManagers.filter(m => m.rosterID == fiveSixMatch.l)[0].managerID];	
			
			const sevenEightMatch = winnersData.slice().filter(f => f.m == numPlayoffMatches)[0];
			finalRank[7] = prevManagers[recordManagers.filter(m => m.rosterID == sevenEightMatch.w)[0].managerID];
			finalRank[8] = prevManagers[recordManagers.filter(m => m.rosterID == sevenEightMatch.l)[0].managerID];	
		}
		// // final ranks of losers-bracket teams
		if(losersBracketType == "toilet") {
			if(numToiletTeams == 0) {
				const toilet = null;
			} else if(numToiletTeams == 2) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]); // last place
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]); // second to last
			} else if(numToiletTeams == 4) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]); // last place
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]); // second to last
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]); // third to last
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]); // fourth to last
			} else if(numToiletTeams == 6) {																				// etc below
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				const fiveSixLoserMatch = losersData.filter(f => f.m == numToiletMatches - 2)[0];
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.w)[0].managerID]); 
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.l)[0].managerID]); 
			} else if(numToiletTeams > 6) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 3)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches - 2)[0];
				const fiveSixLoserMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				const sevenEightLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.l)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == sevenEightLoserMatch.w)[0].managerID]);
				toiletArray.push(prevManagers[recordManagers.filter(m => m.rosterID == sevenEightLoserMatch.l)[0].managerID]);
			}
		} else if(losersBracketType == "consolation") {
			if(numToiletTeams == 0) {
				podium.toilet = null;
			} else if(numToiletTeams == 2) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]); // first LOSER (e.g. 7th place in 6-team playoff league)
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]); // second loser 
			} else if(numToiletTeams == 4) {																						// etc below
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]);
			} else if(numToiletTeams == 6) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				const fiveSixLoserMatch = losersData.filter(f => f.m == numToiletMatches - 2)[0];
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.l)[0].managerID]);
			} else if(numToiletTeams > 6) {
				const toiletBowlMatch = losersData.filter(f => f.m == numToiletMatches - 3)[0];
				podium.toilet = prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID];
				const bronzeLoserMatch = losersData.filter(f => f.m == numToiletMatches - 2)[0];
				const fiveSixLoserMatch = losersData.filter(f => f.m == numToiletMatches - 1)[0];
				const sevenEightLoserMatch = losersData.filter(f => f.m == numToiletMatches)[0];
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == toiletBowlMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == bronzeLoserMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == fiveSixLoserMatch.l)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == sevenEightLoserMatch.w)[0].managerID]);
				consolationArray.push(prevManagers[recordManagers.filter(m => m.rosterID == sevenEightLoserMatch.l)[0].managerID]);
			}
		}
		// translating final ranks depending on league size
		const numTeams = numPOTeams + numToiletTeams;
		// regardless of league size, we already have the top 4
		let processedFinalRanks = {
			year,
			1: finalRank.champion,
			2: finalRank.second,
			3: finalRank.third,
			4: finalRank.fourth,
		};
		// create a rank-child in the parent-object for every team in league (will need later for setting ranks of teams that didn't place in EITHER bracket, if there are any)
		for(let i = 5; i < numTeams; i++) {
			processedFinalRanks[i] = null;
		}
		// now check if 5-8 were named in the winners bracket
		for(let i = 5; i < 8; i++) {
			if(finalRank[i] && finalRank[i] != null) {
				processedFinalRanks[i] = finalRank[i];
			}
		}
		
		if(losersBracketType == "toilet") {  									// working backwards from last place, set the rank IF it has not already been set by the winners bracket check above
			for(let i = 0; i < 8; i++) {
				if(toiletArray[i] && toiletArray[i] != null) {
					if(processedFinalRanks[numTeams - i] == null) {
						processedFinalRanks[numTeams - i] = toiletArray[i];
					}
				}
			}
		} else if(losersBracketType == "coonsolation") { 						// up to 8 ranks can be found from consolation bracket, beginning with the winner of that bracket
			for(let i = 1; i < 9; i++) {
				if(consolationArray[i - 1] && consolationArray[i - 1] != null) {
					processedFinalRanks[numPOTeams + i] = consolationArray[i - 1];			
				}
			}
		}

		podiums.push(podium);
		finalRanks.push(processedFinalRanks);
	}
	return {podiums, finalRanks};
}

// fetch the previous season's data from sleeper
const getPreviousLeagueData = async (previousSeasonID) => {
	const resPromises = [
		fetch(`https://api.sleeper.app/v1/league/${previousSeasonID}`, {compress: true}),
		getLeagueRosters(previousSeasonID),
		getLeagueUsers(previousSeasonID),
		fetch(`https://api.sleeper.app/v1/league/${previousSeasonID}/losers_bracket`, {compress: true}),
		fetch(`https://api.sleeper.app/v1/league/${previousSeasonID}/winners_bracket`, {compress: true}),
	]

	const [leagueRes, rostersData, usersData, losersRes, winnersRes] = await waitForAll(...resPromises).catch((err) => { console.error(err); });

	if(!leagueRes.ok || !losersRes.ok || !winnersRes.ok) {
		throw new Error(data);
	}

	const jsonPromises = [
		leagueRes.json(),
		losersRes.json(),
		winnersRes.json(),
	]

	const [prevLeagueData, losersData, winnersData] = await waitForAll(...jsonPromises).catch((err) => { console.error(err); });

	const year = prevLeagueData.season;	
	const yearP = parseInt(year);
	const numPOTeams = prevLeagueData.settings.playoff_teams;
	const numToiletTeams = prevLeagueData.total_rosters - numPOTeams;
	let losersBracketType;
	if (prevLeagueData.settings.playoff_type == 0) {
		losersBracketType = "toilet";
	} else if(prevLeagueData.settings.playoff_type == 1) {
		losersBracketType = "consolation";
	}

	let leagueManagers = {};

	for(const managerID in managers) {
		const manager = managers[managerID];

		const entryMan = {
			managerID: manager.managerID,
			rosterID: manager.roster,
			name: manager.name,
			status: manager.status,
			yearsactive: manager.yearsactive,
			yearP,
		}

		if(!leagueManagers[manager.roster]) {
			leagueManagers[manager.roster] = [];
		}
		leagueManagers[manager.roster].push(entryMan);
	}

	const previousRosters = rostersData.rosters;
	let recordManagers = [];

	for(const roster of previousRosters) {
		let recordManager = leagueManagers[roster.roster_id].filter(m => m.yearsactive.includes(yearP));
		recordManagers.push(recordManager[0]);
	}

	const numDivisions = prevLeagueData.settings.divisions || 1;

	previousSeasonID = prevLeagueData.previous_league_id;

	const playoffRounds = winnersData[winnersData.length - 1].r
	const numPlayoffMatches = winnersData[winnersData.length - 1].m
	let toiletRounds = 0;
	let numToiletMatches = 0;
	if(numToiletTeams > 0) {
		toiletRounds = losersData[losersData.length - 1].r
		numToiletMatches = losersData[losersData.length - 1].m
	}

	return {
		losersData,
		winnersData,
		numPlayoffMatches,
		numToiletMatches,
		numPOTeams,
		numToiletTeams,
		losersBracketType,
		year,
		previousRosters,
		numDivisions,
		usersData,
		previousSeasonID,
		playoffRounds,
		toiletRounds,
		leagueMetadata: prevLeagueData.metadata,
		recordManagers,
	}
}

// determine division champions and construct previousManagers object
const buildDivisionsAndManagers = ({usersData, previousRosters, leagueMetadata, numDivisions, recordManagers}) => {
	const prevManagers = {};

	const divisions = {};

	for(let i = 0; i < numDivisions; i++) {
		divisions[i+1] = {
			name: leagueMetadata ? leagueMetadata[`division_${i + 1}`] : null,
			roster: null,
			wins: -1,
			points: -1,
			recordManID: null,
		}
	}

	for(const roster of previousRosters) {
		const rSettings = roster.settings;
		const div = rSettings.division ? rSettings.division : 1;

		let recordManager = recordManagers.filter(m => m.rosterID == roster.roster_id);
		let recordManID = recordManager[0].managerID;

		if(rSettings.wins > divisions[div].wins || (rSettings.wins == divisions[div].wins && (rSettings.fpts  + rSettings.fpts_decimal / 100)  == divisions[div].points)) {
			divisions[div].points = rSettings.fpts  + rSettings.fpts_decimal / 100;
			divisions[div].wins = rSettings.wins;
			divisions[div].roster = roster.roster_id;
			divisions[div].recordManID = recordManID;
		}
		const user = usersData[roster.owner_id];

		prevManagers[recordManID] = {
			rosterID: roster.roster_id,
			avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
			name: 'Unknown Manager',
			realname: 'John Q. Rando',
			recordManID,
			ownerID: roster.owner_id,
		}
		if(user) {
			if(user.avatar != null) {
				prevManagers[recordManID].avatar = `https://sleepercdn.com/avatars/thumbs/${user.avatar}`;
			} else {
				prevManagers[recordManID].avatar = `https://sleepercdn.com/images/v2/icons/player_default.webp`;
			}
			prevManagers[recordManID].name = user.metadata.team_name ? user.metadata.team_name : user.display_name;
			prevManagers[recordManID].realname = recordManager[0].name;
		}
		
	}

	return {divisions, prevManagers}
}