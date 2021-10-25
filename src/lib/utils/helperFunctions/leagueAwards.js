import { getLeagueData } from './leagueData';
import { getLeagueRosters } from './leagueRosters';
import { getLeagueUsers } from './leagueUsers';
import {waitForAll} from './multiPromise';
import { get } from 'svelte/store';
import {awards} from '$lib/stores';
import { managers } from '$lib/utils/leagueInfo';


export const getAwards = async () => {
	if(get(awards).podiums) {
		return get(awards);
	}
	const [rosterRes, users, leagueData] = await waitForAll(
		getLeagueRosters(),
		getLeagueUsers(),
		getLeagueData()
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
				avatar: `https://sleepercdn.com/avatars/thumbs/${user.avatar}`,
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

	const podiums = await getPodiums(previousSeasonID)

	const gatheredAwards = {
		podiums,
		currentManagers
	};

	awards.update(() => gatheredAwards);

	return gatheredAwards;
}

const getPodiums = async (previousSeasonID) => {
	const podiums = [];

	while(previousSeasonID && previousSeasonID != 0) {
		// use the previous season ID to get the previous league, roster, user, and bracket data
		const previousSeasonData = await getPreviousLeagueData(previousSeasonID);

		const {
			losersData,
			winnersData,
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

		const finalsMatch = winnersData.filter(m => m.r == playoffRounds && m.t1_from.w)[0];

		let recordChamp = recordManagers.filter(m => m.rosterID == finalsMatch.w);
		let recordChampID = recordChamp[0].managerID;
		const champion = prevManagers[recordChampID];
		let recordSilver = recordManagers.filter(m => m.rosterID == finalsMatch.l);
		let recordSilverID = recordSilver[0].managerID;
		const second = prevManagers[recordSilverID];
	
		const runnersUpMatch = winnersData.filter(m => m.r == playoffRounds && m.t1_from.l)[0];
		let recordBronze = recordManagers.filter(m => m.rosterID == runnersUpMatch.w);
		let recordBronzeID = recordBronze[0].managerID;
		const third = prevManagers[recordBronzeID];

		const toiletBowlMatch = losersData.filter(m => m.r == toiletRounds && (!m.t1_from || m.t1_from.w))[0];
		let recordToilet = recordManagers.filter(m => m.rosterID == toiletBowlMatch.w);
		let recordToiletID = recordToilet[0].managerID;
		const toilet = prevManagers[recordToiletID]

		const podium = {
			year,
			champion,
			second,
			third,
			divisions: divisionArr,
			toilet
		}
		podiums.push(podium);
	}
	return podiums;
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
	let yearP = parseInt(year);

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
	const toiletRounds = losersData[losersData.length - 1].r

	return {
		losersData,
		winnersData,
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
			prevManagers[recordManID].avatar = `https://sleepercdn.com/avatars/thumbs/${user.avatar}`;
			prevManagers[recordManID].name = user.metadata.team_name ? user.metadata.team_name : user.display_name;
			prevManagers[recordManID].realname = recordManager[0].name;
		}
		
	}

	return {divisions, prevManagers}
}