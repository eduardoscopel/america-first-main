import { getLeagueData } from './leagueData';
import { leagueID, managers } from '$lib/utils/leagueInfo';
import { getNflState } from './nflState';
import { getLeagueRosters } from "./leagueRosters"
import { getLeagueUsers } from "./leagueUsers"
import { waitForAll } from './multiPromise';
import { get } from 'svelte/store';
import {records} from '$lib/stores';
import { loadPlayers, getPreviousDrafts } from '$lib/utils/helper';
import { null_to_empty } from 'svelte/internal';

export const getLeagueRecords = async (refresh = false) => {
	if(get(records).seasonWeekRecords) {
		return get(records);
	}

	// if this isn't a refresh data call, check if there are already transactions stored in localStorage
	if(!refresh) {
		let localRecords = await JSON.parse(localStorage.getItem("records"));
		// check if transactions have been saved to localStorage before
		if(localRecords) {
			localRecords.stale = true;
			return localRecords;
		}
	}

	const playersData = await loadPlayers().catch((err) => { console.error(err); });
	const playersInfo = playersData.players;

	const previousDraftsData = await getPreviousDrafts().catch((err) => { console.error(err); });
	let draftInfo = {};

	for(const key in previousDraftsData) {
		const prevDraft = previousDraftsData[key];
		
		if(!draftInfo[prevDraft.year]) {
			draftInfo[prevDraft.year] = prevDraft;
		}
	}

	const nflState = await getNflState().catch((err) => { console.error(err); });
	let week = 0;
	let POrecordsWeek = 0;
	if(nflState.season_type == 'regular') {
		week = nflState.week - 1;
	} else if(nflState.season_type == 'post') {
		week = 18;
	}

	let curSeason = leagueID;

	let currentManagers;
	
	let currentYear;
	let lastYear;

	let allTimeMatchupDifferentials = [];
	let allTimePOMatchupDifferentials = [];

	let leagueRosterRecords = {}; 				// every full season stat point (for each year and all years combined)
	let playoffRosterRecords = {}; 
	let seasonWeekRecords = []; 				// highest weekly points within a single season
	let playoffWeekRecords = [];
	let leagueWeekRecords = [];					// highest weekly points within a single season
	let leaguePOWeekRecords = [];
	let leagueWeekLows = []; 					// lowest weekly points within a single season
	let leaguePOWeekLows = [];

	let masterRecordBook = {
		managers: {
			regularSeason: {
				alltime: {},
				years: {},
			},
			playoffs: {
				alltime: {},
				years: {},
			},
			combined: {
				alltime: {},
				years: {},
			},
			totals: {
				alltime: {},
				years: {},
			},
			grandTotals: {},
		},
		league: {
			regularSeason: {
				alltime: [],
				years: {},
			},
			playoffs: {
				alltime: [],
				years: {},
			},
			combined: {
				alltime: [],
				years: {},
			},
			totals: {
				alltime: {},
				years: {},
			},
			grandTotals: {
				regularSeason: [],
				playoffs: [],
				combined: [],
			},
		},
		players: {
			managers: {
				regularSeason: {
					alltime: {},
					years: {},
				},
				playoffs: {
					alltime: {},
					years: {},
				},
				combined: {
					alltime: {},
					years: {},
				},
				totals: {
					alltime: {},
					years: {},
					playerIDs: {},
				},
				grandTotals: {
					regularSeason: [],
					playoffs: [],
					combined: [],
				},
			},
			league: {
				regularSeason: {
					alltime: [],
					years: {},
				},
				playoffs: {
					alltime: [],
					years: {},
				},
				combined: {
					alltime: [],
					years: {},
				},
				totals: {
					alltime: {},
					years: {},
				},
				grandTotals: {
					regularSeason: [],
					playoffs: [],
					combined: [],
				},
			},
		},
	};

	let mostSeasonLongPoints = []; 				// 10 highest full season points
	let leastSeasonLongPoints = []; 			// 10 lowest full season points

	let allTimeBiggestBlowouts = []; 			// 10 biggest blowouts
	let allTimeBiggestPOBlowouts = [];
	let allTimeClosestMatchups = []; 			// 10 closest matchups
	let allTimeClosestPOMatchups = [];

	let allTimeWeekBests = []; 					// each manager's highest scoring week
	let allTimeWeekWorsts = []; 				// each manager's lowest scoring week
	let allTimeSeasonBests = []; 				// each manager's highest scoring season
	let allTimeSeasonWorsts = []; 				// each manager's lowest scoring season
	let allTimeEPERecords = [];					// each manager's all-time EPE stats

	let alltimePlayoffWeekBests = []; 					// each manager's highest scoring week
	let alltimePlayoffWeekWorsts = []; 				// each manager's lowest scoring week
	let alltimePlayoffBests = []; 				// each manager's highest scoring season
	let alltimePlayoffWorsts = []; 				// each manager's lowest scoring season

	let playerATSeasonBests = []; 				// each manager's all-time leading individual starter (season)
	let playerATWeekBests = [];					// each manager's all-time best scoring week by individual starters
	let playerATWeekMissedBests = [];
	let playerATWeekTOPS = [];					// 10 all-time best scoring weeks by individual starters
	let playerATWeekMissedTOPS = [];					// 10 all-time best scoring weeks by individual starters
	let playerATSeasonTOPS = [];				// 10 all-time best scoring seasons by individual starters

	let playerATPlayoffBests = []; 				// each manager's all-time leading individual starter (season)
	let playerATPOWeekBests = [];					// each manager's all-time best scoring week by individual starters
	let playerATPOWeekMissedBests = [];
	let playerATPOWeekTOPS = [];					// 10 all-time best scoring weeks by individual starters
	let playerATPOWeekMissedTOPS = [];					// 10 all-time best scoring weeks by individual starters
	let playerATPlayoffTOPS = [];				// 10 all-time best scoring seasons by individual starters

	let leagueManagers = {};
	let activeManagers = [];

	let playerRecords = {};
	let seasonPlayerRecords = {};
	let seasonTeamPOSRecords = {};

	let POplayerRecords = {};
	let playoffPlayerRecords = {};
	let playoffTeamPOSRecords = {};

	let acquisitionRecords = {};

	const numManagers = managers.length;
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

		if(manager.status == "active") {
			activeManagers.push(manager.managerID);
		}
	}
	const numActiveManagers = activeManagers.length;

	while(curSeason && curSeason != 0) {
		const [rosterRes, users, leagueData] = await waitForAll(
			getLeagueRosters(curSeason),
			getLeagueUsers(curSeason),
			getLeagueData(curSeason),
		).catch((err) => { console.error(err); });
	
		let year = parseInt(leagueData.season);

		// variables for playoff records
		let numPOTeams = parseInt(leagueData.settings.playoff_teams);
		let playoffStart = parseInt(leagueData.settings.playoff_week_start);
		let playoffLength;
		let playoffType;
		let playoffCase;							// for later determining which playoff matchups we want to count (vs. discard)

		// before 2020, 1 week per PO round was only option
		if(year > 2019) {
			playoffType = parseInt(leagueData.settings.playoff_round_type);
		} else {
			playoffType = 0;
		}

		// calculate length of playoffs										"Relevant" Match IDs
		if(playoffType == 0) {							// 1W/r		4-team		6-team		8-team
			if(numPOTeams == 6) {						// last:	1, 2		1, 2		1, 2, 3, 4 						
				playoffLength = 3;						// 2-last:	1, 2		1, 2, 3		1, 2, 3, 4
				playoffCase = 1;						// 3-last:				1, 2		1, 2, 3, 4
			} else if(numPOTeams == 8) {
				playoffLength = 3;
				playoffCase = 2;
			} else if(numPOTeams == 4) {			
				playoffLength = 2;						
				playoffCase = 3;					
			}
		} else if(playoffType == 1 && year > 2020) {	// 1W/r+2c  4-team		6-team		8-team
			if(numPOTeams == 6) {						// last:	1			1			1
				playoffLength = 4;						// 2-last:	1, 2		1, 2		1, 2, 3, 4
				playoffCase = 4;						// 3-last:	1, 2		1, 2, 3		1, 2, 3, 4
			} else if(numPOTeams == 8) {				// 4-last:				1, 2		1, 2, 3, 4
				playoffLength = 4;
				playoffCase = 5
			} else if(numPOTeams == 4) {
				playoffLength = 3;
				playoffCase = 6;
			}
		} else if(playoffType == 2 ||
				  playoffType == 1 && year == 2020) {	// 2W/r  	4-team		6-team		8-team
			if(numPOTeams == 6) {						// last:	1, 2		1, 2		1, 2, 3, 4	
				playoffLength = 6;						// 2-last:	1, 2		1, 2		1, 2, 3, 4	
				playoffCase = 7;						// 3-last:	1, 2		1, 2, 3 	1, 2, 3, 4
			} else if (numPOTeams == 8) {				// 4-last: 	1, 2		1, 2, 3		1, 2, 3, 4
				playoffLength = 6;						// 5-last:				1, 2		1, 2, 3, 4
				playoffCase = 8;						// 6-last:				1, 2		1, 2, 3, 4
			} else if (numPOTeams == 4) {
				playoffLength = 4;
				playoffCase = 9;
			}
		}

		POrecordsWeek = playoffStart + playoffLength - 1;

		// on first run, week is provided above from nflState,
		// after that get the final week of regular season from leagueData
		if(leagueData.status == 'complete' || week > playoffStart - 1) {
			week = playoffStart - 1;
		}

		lastYear = year;
	
		const rosters = rosterRes.rosters;
		const numSeasonManagers = rosters.length;
		
		for(const roster of rosters) {
			const rosterID = roster.roster_id;		

			let recordManager = leagueManagers[rosterID].filter(m => m.yearsactive.includes(year));
			let recordManrosterID = recordManager[0].rosterID;
			let recordManID = recordManager[0].managerID;
			
			const draftResults = draftInfo[year].draft;
			for(const round in draftResults) {
				const draftPicks = draftResults[round];

				for(const pick in draftPicks) {
					const draftPick = draftPicks[pick].player;

					if(!acquisitionRecords[year]) {
						acquisitionRecords[year] = {};
					}

					if(draftPick.rosterID == recordManrosterID) {

						if(!acquisitionRecords[year][recordManID]) {
							acquisitionRecords[year][recordManID] = [];
						}
						acquisitionRecords[year][recordManID].push(draftPick);
					}
				}
			}
		}

		const originalManagers = {};
	
		for(const roster of rosters) {
			const rosterID = roster.roster_id;
			const user = users[roster.owner_id];
			
			let recordManager = leagueManagers[rosterID].filter(m => m.yearsactive.includes(year));
			let recordManID = recordManager[0].managerID;

			if(user) {
				originalManagers[recordManID] = {
					avatar: `https://sleepercdn.com/avatars/thumbs/${user.avatar}`,
					name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
					realname: recordManager[0].name,
				};
			} else {
				originalManagers[recordManID] = {
					avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
					name: 'Unknown Manager',
					realname: 'John Q. Rando',
				};
			}

			if(roster.settings.wins == 0 && roster.settings.ties == 0 && roster.settings.losses == 0) continue;

			if(!leagueRosterRecords[recordManID]) {
				leagueRosterRecords[recordManID] = {
					wins: 0,
					losses: 0,
					ties: 0,
					fptsFor: 0,
					fptsAgainst: 0,
					potentialPoints: 0,
					fptspg: 0,
					manager: originalManagers[recordManID],
					years: [],
				}
			}

			const fpts = roster.settings.fpts + (roster.settings.fpts_decimal / 100);
			const fptsAgainst = roster.settings.fpts_against + (roster.settings.fpts_against_decimal / 100);
			const potentialPoints = roster.settings.ppts + (roster.settings.ppts_decimal / 100);
			const fptspg = roster.settings.fpts / (roster.settings.wins + roster.settings.losses + roster.settings.ties);

			// add records to league roster record record
			leagueRosterRecords[recordManID].wins += roster.settings.wins;
			leagueRosterRecords[recordManID].losses += roster.settings.losses;
			leagueRosterRecords[recordManID].ties += roster.settings.ties;
			leagueRosterRecords[recordManID].fptsFor += fpts;
			leagueRosterRecords[recordManID].fptsAgainst += fptsAgainst;
			leagueRosterRecords[recordManID].potentialPoints += potentialPoints;

			// add singleSeason info [`${year}fptsFor`]
			const singleYearInfo = {
				wins: roster.settings.wins,
				losses: roster.settings.losses,
				ties: roster.settings.ties,
				fpts,
				fptsAgainst,
				potentialPoints,
				fptspg,
				manager: originalManagers[recordManID],
				year,
				recordManID,
			}

			leagueRosterRecords[recordManID].years.push(singleYearInfo);

			if(!playoffRosterRecords[recordManID]) {
				playoffRosterRecords[recordManID] = {
					wins: 0,
					losses: 0,
					ties: 0,
					fptsFor: 0,
					fptsAgainst: 0,
					potentialPoints: 0,
					fptspg: 0,
					POgames: 0,
					manager: originalManagers[recordManID],
					years: {},
					recordManID,
				}
			}

			playoffRosterRecords[recordManID].years[year] = {
				wins: 0,
				losses: 0,
				ties: 0,
				fpts: 0,
				fptsAgainst: 0,
				potentialPoints: 0,
				fptspg: 0,
				POgames: 0,
				manager: originalManagers[recordManID],
				year,
				recordManID,
			}
				
		}
		
		if(!currentManagers) {
			currentManagers = originalManagers;
		}

		// loop through each week of the season
		const matchupsPromises = [];
		let startWeek = parseInt(week);

		const POmatchupsPromises = [];
		let POstartWeek = parseInt(POrecordsWeek);

		while(week > 0) {
			matchupsPromises.push(fetch(`https://api.sleeper.app/v1/league/${curSeason}/matchups/${week}`, {compress: true}))
			week--;
		}
		while(POrecordsWeek > playoffStart - 1) {
			POmatchupsPromises.push(fetch(`https://api.sleeper.app/v1/league/${curSeason}/matchups/${POrecordsWeek}`, {compress: true}))
			POrecordsWeek--;
		}
	
		const matchupsRes = await waitForAll(...matchupsPromises).catch((err) => { console.error(err); });
		const POmatchupsRes = await waitForAll(...POmatchupsPromises).catch((err) => { console.error(err); });

		// convert the json matchup responses
			//regular season
		const matchupsJsonPromises = [];
		for(const matchupRes of matchupsRes) {
			const data = matchupRes.json();
			matchupsJsonPromises.push(data)
			if (!matchupRes.ok) {
				throw new Error(data);
			}
		}
		const matchupsData = await waitForAll(...matchupsJsonPromises).catch((err) => { console.error(err); });
			// playoffs
		const POmatchupsJsonPromises = [];
		for(const POmatchupRes of POmatchupsRes) {
			const POdata = POmatchupRes.json();
			POmatchupsJsonPromises.push(POdata)
			if (!POmatchupRes.ok) {
				throw new Error(POdata);
			}
		}
		const POmatchupsData = await waitForAll(...POmatchupsJsonPromises).catch((err) => { console.error(err); });

		// now that we've used the current season ID for everything we need, set it to the previous season
		curSeason = leagueData.previous_league_id;

		let matchupDifferentials = [];

		let playerWeekEfforts = [];
		let playerWeekMissedEfforts = [];
		let playerWeekMissedTOPS = [];

		let playerPOWeekTOPS = [];				// top 10 player single-week scores
		let	playerPOWeekBests = [];				// ranking all manager's highest-scoring player (week)
		let playerPOWeekEfforts = [];
		let playerPOWeekMissedBests = [];
		let playerPOWeekMissedEfforts = [];
		let playerPOWeekMissedTOPS = [];

		const playoffPointsRecord = [];
		let POmatchupDifferentials = [];

		// CREATING YEARLY RECORD OBJECTS/ARRAYS
		// League Objects/Arrays (for all-around records)
		masterRecordBook.league.playoffs.years[year] = [];
		masterRecordBook.league.regularSeason.years[year] = [];
		masterRecordBook.league.combined.years[year] = [];
		masterRecordBook.league.totals.years[year] = {};
		// Manager Objects/Arrays (for rankings)
		masterRecordBook.managers.playoffs.years[year] = [];
		masterRecordBook.managers.regularSeason.years[year] = [];
		masterRecordBook.managers.combined.years[year] = [];
		masterRecordBook.managers.totals.years[year] = [];
		// Player Objects/Arrays
		masterRecordBook.players.league.playoffs.years[year] = [];
		masterRecordBook.players.league.regularSeason.years[year] = [];
		masterRecordBook.players.league.combined.years[year] = [];
		masterRecordBook.players.league.totals.years[year] = [];
		masterRecordBook.players.managers.playoffs.years[year] = [];
		masterRecordBook.players.managers.regularSeason.years[year] = [];
		masterRecordBook.players.managers.combined.years[year] = [];
		masterRecordBook.players.managers.totals.years[year] = [];
	
		if(startWeek > playoffStart - 1 || leagueData.status == 'complete') {
			// process all the PLAYOFFS matchups

			for(const POmatchupWeek of POmatchupsData) {
				let POmatchups = {};
				let POround = POstartWeek - POrecordsWeek;

				for(const POmatchup of POmatchupWeek) {
					let recordManager = leagueManagers[POmatchup.roster_id].filter(m => m.yearsactive.includes(year));
					let recordManID = recordManager[0].managerID;

					const POentry = {
						manager: originalManagers[recordManID],
						fpts: POmatchup.points,
						starters_points: POmatchup.starters_points,
						players_points: POmatchup.players_points,
						starters: POmatchup.starters,
						players: POmatchup.players,
						week: POstartWeek,
						year,
						rosterID: POmatchup.roster_id,
						recordManID,
					}

					// add each entry to the POmatchup object
					if(!POmatchups[POmatchup.matchup_id]) {
						POmatchups[POmatchup.matchup_id] = [];
					}
					POmatchups[POmatchup.matchup_id].push(POentry);
				}

				if(playoffCase == 4 && POstartWeek == POrecordsWeek + playoffLength ||     // Relevant Match IDs: 1
				   playoffCase == 5 && POstartWeek == POrecordsWeek + playoffLength ||
				   playoffCase == 6 && POstartWeek == POrecordsWeek + playoffLength) {

					const champMatch = POmatchups[1];

					let home = champMatch[0];
					let away = champMatch[1];
					if(champMatch[0].fpts < champMatch[1].fpts) {
						home = champMatch[1];
						away = champMatch[0];
					}

					const POmatchupDifferential = {
						year: home.year,
						week: home.week,
						home: {
							manager: home.manager,
							fpts: home.fpts,
							recordManID: home.recordManID,
						},
						away: {
							manager: away.manager,
							fpts: away.fpts,
							recordManID: away.recordManID,
						},
						differential: home.fpts - away.fpts
					}
					allTimePOMatchupDifferentials.push(POmatchupDifferential);
					POmatchupDifferentials.push(POmatchupDifferential);

					for(const key in champMatch) {
						const opponent = champMatch[key];

						playoffRosterRecords[opponent.recordManID].years[year].fpts += opponent.fpts;
						playoffRosterRecords[opponent.recordManID].years[year].POgames++;

						const POweekEntry = {
							manager: opponent.manager,
							recordManID: opponent.recordManID,
							rosterID: opponent.rosterID,
							fpts: opponent.fpts,
							epePOWins: 0,
							epePOTies: 0,
							epePOLosses: 0,
							POweekWinner: new Boolean(false),
							POweekLoser: new Boolean(false),
							week: opponent.week,
							year,
						}

						const comboEntry = {
							manager: opponent.manager,
							recordManID: opponent.recordManID,
							rosterID: opponent.rosterID,
							fpts: opponent.fpts,
							fptspg: null,
							epeWins: 0,
							epeTies: 0,
							epeLosses: 0,
							epePerc: 0,
							weekWinner: new Boolean(false),
							weekLoser: new Boolean(false),
							weekTie: new Boolean(false),
							medianPerc: null,
							topScore: new Boolean(false),
							bottomScore: new Boolean(false),
							week: opponent.week,
							year,
						}

						playoffPointsRecord.push(POweekEntry);

						masterRecordBook.league.playoffs.alltime.push(comboEntry);
						masterRecordBook.league.combined.alltime.push(comboEntry);
						if(!masterRecordBook.managers.playoffs.alltime[opponent.recordManID]) {
							masterRecordBook.managers.playoffs.alltime[opponent.recordManID] = [];
						}
						masterRecordBook.managers.playoffs.alltime[opponent.recordManID].push(comboEntry);
						if(!masterRecordBook.managers.combined.alltime[opponent.recordManID]) {
							masterRecordBook.managers.combined.alltime[opponent.recordManID] = [];
						}
						masterRecordBook.managers.combined.alltime[opponent.recordManID].push(comboEntry);

						masterRecordBook.league.playoffs.years[year].push(comboEntry);
						masterRecordBook.league.combined.years[year].push(comboEntry);
						if(!masterRecordBook.managers.playoffs.years[year][opponent.recordManID]) {
							masterRecordBook.managers.playoffs.years[year][opponent.recordManID] = [];
						}
						masterRecordBook.managers.playoffs.years[year][opponent.recordManID].push(comboEntry);
						if(!masterRecordBook.managers.combined.years[year][opponent.recordManID]) {
							masterRecordBook.managers.combined.years[year][opponent.recordManID] = [];
						}
						masterRecordBook.managers.combined.years[year][opponent.recordManID].push(comboEntry);

						const starters = opponent.starters;
						const startersPTS = opponent.starters_points.sort((a, b) => b - a);
						const numStarters = opponent.starters_points.length;
		
						const players = opponent.players;
						const playersPTS = opponent.players_points;
						
						for(let i = 0; i < players.length; i++) {
		
							const playerID = players[i];
		
							if(!POplayerRecords[year]) {
								POplayerRecords[year] = {};
							}
							if(!POplayerRecords[year][opponent.recordManID]) {
								POplayerRecords[year][opponent.recordManID] = {};
							}
		
							const playerPoints = playersPTS[playerID];
		
							let topStarter = new Boolean (false);
							let bottomStarter = new Boolean (false);
							let starterRank;
							let PTSasStarter;
							let PTSonBench;
							let benched = new Boolean (true);
		
							if(starters.includes(playerID)) {
								benched = false;
								PTSasStarter = playerPoints;
								PTSonBench = 0;
								starterRank = startersPTS.indexOf(playerPoints) + 1;
								if(startersPTS[0] == playerPoints) {
									topStarter = true;
								} else if(startersPTS[startersPTS.length - 1] == playerPoints) {
									bottomStarter = true;
								}
							} else {
								benched = true;
								PTSonBench = playerPoints;
								PTSasStarter = 0;
								topStarter = false;
								bottomStarter = false;
								starterRank = null;
							}
							
							let playerInfo = playersInfo[playerID];
							let avatar = playerInfo.pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;

							if(!POplayerRecords[year][opponent.recordManID][playerID]) {
								POplayerRecords[year][opponent.recordManID][playerID] = [];
							}
		
							const playerEntry = {		
								recordManID: opponent.recordManID,
								manager: originalManagers[opponent.recordManID],
								week: POstartWeek,
								year,
								rosterID: opponent.rosterID,
								playerID,
								playerPoints: PTSasStarter,
								benchPoints: PTSonBench,
								weeksStarted: null,
								weeksBenched: null,
								weeksOwned: null,
								benched,
								howAcquired: null,
								weekAcquired: null,
								topStarter,
								bottomStarter,
								starterRank,
								numStarters,
								starterRankAVG: null,
								playerInfo,
								avatar,
							}
		
							// right now, acquisitions is just a list of the manager's draft picks
							let acquisitions = acquisitionRecords[year][opponent.recordManID];
							for(let i = 0; i < acquisitions.length; i++) {
								if(acquisitions[i].playerID == playerID) {
									playerEntry.howAcquired = 'draft';
									playerEntry.weekAcquired = 0;
								} 
							}
							POplayerRecords[year][opponent.recordManID][playerID].push(playerEntry);

							// add player arrays to ALLTIME

							masterRecordBook.players.league.playoffs.alltime.push(playerEntry);
							masterRecordBook.players.league.combined.alltime.push(playerEntry);
							if(!masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID]) {
								masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID].push(playerEntry);
							if(!masterRecordBook.players.managers.combined.alltime[opponent.recordManID]) {
								masterRecordBook.players.managers.combined.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.players.managers.combined.alltime[opponent.recordManID].push(playerEntry);

							// add player arrays to YEARS

							masterRecordBook.players.league.playoffs.years[year].push(playerEntry);
							masterRecordBook.players.league.combined.years[year].push(playerEntry);
							if(!masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID]) {
								masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID].push(playerEntry);
							if(!masterRecordBook.players.managers.combined.years[year][opponent.recordManID]) {
								masterRecordBook.players.managers.combined.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.players.managers.combined.years[year][opponent.recordManID].push(playerEntry);
						}
					}

					playoffRosterRecords[home.recordManID].years[year].fptsAgainst += away.fpts;
					playoffRosterRecords[away.recordManID].years[year].fptsAgainst += home.fpts;

					if(POmatchupDifferential.differential == 0) {
						playoffRosterRecords[home.recordManID].years[year].ties++;
						playoffRosterRecords[away.recordManID].years[year].ties++;
					} else {
						playoffRosterRecords[home.recordManID].years[year].wins++;
						playoffRosterRecords[away.recordManID].years[year].losses++;
					}
				} else if(playoffCase == 3 ||														// Relevant Match IDs: 1, 2
				   		  playoffCase == 9 ||
				   		  playoffCase == 6 && POstartWeek < POrecordsWeek + playoffLength ||
				 		  playoffCase == 1 && POround != 2 ||
				 		  playoffCase == 4 && POround == 1 ||
				  		  playoffCase == 4 && POround == 3 ||
					      playoffCase == 7 && POround < 3 ||
				  		  playoffCase == 7 && POround > 4) {
					
					for(let i = 1; i < 3; i++) {

						let home = POmatchups[i][0];
						let away = POmatchups[i][1];
						if(POmatchups[i][0].fpts < POmatchups[i][1].fpts) {
							home = POmatchups[i][1];
							away = POmatchups[i][0];
						}
	
						const POmatchupDifferential = {
							year: home.year,
							week: home.week,
							home: {
								manager: home.manager,
								fpts: home.fpts,
								recordManID: home.recordManID,
							},
							away: {
								manager: away.manager,
								fpts: away.fpts,
								recordManID: away.recordManID,
							},
							differential: home.fpts - away.fpts
						}
						allTimePOMatchupDifferentials.push(POmatchupDifferential);
						POmatchupDifferentials.push(POmatchupDifferential);

						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key];

							playoffRosterRecords[opponent.recordManID].years[year].fpts += opponent.fpts;
							playoffRosterRecords[opponent.recordManID].years[year].POgames++;
	
							const POweekEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								epePOWins: 0,
								epePOTies: 0,
								epePOLosses: 0,
								POweekWinner: new Boolean(false),
								POweekLoser: new Boolean(false),
								week: opponent.week,
								year,
							}

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: new Boolean(false),
								weekLoser: new Boolean(false),
								weekTie: new Boolean(false),
								medianPerc: null,
								topScore: new Boolean(false),
								bottomScore: new Boolean(false),
								week: opponent.week,
								year,
							}
							
							playoffPointsRecord.push(POweekEntry);

							masterRecordBook.league.playoffs.alltime.push(comboEntry);
							masterRecordBook.league.combined.alltime.push(comboEntry);
							if(!masterRecordBook.managers.playoffs.alltime[opponent.recordManID]) {
								masterRecordBook.managers.playoffs.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.alltime[opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.alltime[opponent.recordManID]) {
								masterRecordBook.managers.combined.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.alltime[opponent.recordManID].push(comboEntry);
	
							masterRecordBook.league.playoffs.years[year].push(comboEntry);
							masterRecordBook.league.combined.years[year].push(comboEntry);
							if(!masterRecordBook.managers.playoffs.years[year][opponent.recordManID]) {
								masterRecordBook.managers.playoffs.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.years[year][opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.years[year][opponent.recordManID]) {
								masterRecordBook.managers.combined.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.years[year][opponent.recordManID].push(comboEntry);

							const starters = opponent.starters;
							const startersPTS = opponent.starters_points.sort((a, b) => b - a);
							const numStarters = opponent.starters_points.length;
			
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
			
								if(!POplayerRecords[year]) {
									POplayerRecords[year] = {};
								}
								if(!POplayerRecords[year][opponent.recordManID]) {
									POplayerRecords[year][opponent.recordManID] = {};
								}
			
								const playerPoints = playersPTS[playerID];
			
								let topStarter = new Boolean (false);
								let bottomStarter = new Boolean (false);
								let starterRank;
								let PTSasStarter;
								let PTSonBench;
								let benched = new Boolean (true);
			
								if(starters.includes(playerID)) {
									benched = false;
									PTSasStarter = playerPoints;
									PTSonBench = 0;
									starterRank = startersPTS.indexOf(playerPoints) + 1;
									if(startersPTS[0] == playerPoints) {
										topStarter = true;
									} else if(startersPTS[startersPTS.length - 1] == playerPoints) {
										bottomStarter = true;
									}
								} else {
									benched = true;
									PTSonBench = playerPoints;
									PTSasStarter = 0;
									topStarter = false;
									bottomStarter = false;
									starterRank = null;
								}
								
								let playerInfo = playersInfo[playerID];
								let avatar = playerInfo.pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
	
								if(!POplayerRecords[year][opponent.recordManID][playerID]) {
									POplayerRecords[year][opponent.recordManID][playerID] = [];
								}
			
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: PTSasStarter,
									benchPoints: PTSonBench,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched,
									howAcquired: null,
									weekAcquired: null,
									topStarter,
									bottomStarter,
									starterRank,
									numStarters,
									starterRankAVG: null,
									playerInfo,
									avatar,
								}
			
								// right now, acquisitions is just a list of the manager's draft picks
								let acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(let i = 0; i < acquisitions.length; i++) {
									if(acquisitions[i].playerID == playerID) {
										playerEntry.howAcquired = 'draft';
										playerEntry.weekAcquired = 0;
									} 
								}
								POplayerRecords[year][opponent.recordManID][playerID].push(playerEntry);
	
								// add player arrays to ALLTIME

								masterRecordBook.players.league.playoffs.alltime.push(playerEntry);
								masterRecordBook.players.league.combined.alltime.push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID] = [];
								}	
								masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.combined.alltime[opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.alltime[opponent.recordManID].push(playerEntry);

								// add player arrays to YEARS

								masterRecordBook.players.league.playoffs.years[year].push(playerEntry);
								masterRecordBook.players.league.combined.years[year].push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.combined.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.years[year][opponent.recordManID].push(playerEntry);
							}
						}
	
						playoffRosterRecords[home.recordManID].years[year].fptsAgainst += away.fpts;
						playoffRosterRecords[away.recordManID].years[year].fptsAgainst += home.fpts;
	
						if(POmatchupDifferential.differential == 0) {
							playoffRosterRecords[home.recordManID].years[year].ties++;
							playoffRosterRecords[away.recordManID].years[year].ties++;
						} else {
							playoffRosterRecords[home.recordManID].years[year].wins++;
							playoffRosterRecords[away.recordManID].years[year].losses++;
						}
					}
				} else if(playoffCase == 7 && 2 < POround < 5 ||									// Relevant Match IDs: 1, 2, 3
				   		  playoffCase == 4 && POround == 2 ||
				   		  playoffCase == 1 && POround == 2) {

					for(let i = 1; i < 4; i++) {
						
						let home = POmatchups[i][0];
						let away = POmatchups[i][1];
						if(POmatchups[i][0].fpts < POmatchups[i][1].fpts) {
							home = POmatchups[i][1];
							away = POmatchups[i][0];
						}
	
						const POmatchupDifferential = {
							year: home.year,
							week: home.week,
							home: {
								manager: home.manager,
								fpts: home.fpts,
								recordManID: home.recordManID,
							},
							away: {
								manager: away.manager,
								fpts: away.fpts,
								recordManID: away.recordManID,
							},
							differential: home.fpts - away.fpts
						}
						allTimePOMatchupDifferentials.push(POmatchupDifferential);
						POmatchupDifferentials.push(POmatchupDifferential);
	
						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key];

							playoffRosterRecords[opponent.recordManID].years[year].fpts += opponent.fpts;
							playoffRosterRecords[opponent.recordManID].years[year].POgames++;
	
							const POweekEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								epePOWins: 0,
								epePOTies: 0,
								epePOLosses: 0,
								POweekWinner: new Boolean(false),
								POweekLoser: new Boolean(false),
								week: opponent.week,
								year,
							}

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: new Boolean(false),
								weekLoser: new Boolean(false),
								weekTie: new Boolean(false),
								medianPerc: null,
								topScore: new Boolean(false),
								bottomScore: new Boolean(false),
								week: opponent.week,
								year,
							}

							playoffPointsRecord.push(POweekEntry);

							masterRecordBook.league.playoffs.alltime.push(comboEntry);
							masterRecordBook.league.combined.alltime.push(comboEntry);
							if(!masterRecordBook.managers.playoffs.alltime[opponent.recordManID]) {
								masterRecordBook.managers.playoffs.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.alltime[opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.alltime[opponent.recordManID]) {
								masterRecordBook.managers.combined.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.alltime[opponent.recordManID].push(comboEntry);
	
							masterRecordBook.league.playoffs.years[year].push(comboEntry);
							masterRecordBook.league.combined.years[year].push(comboEntry);
							if(!masterRecordBook.managers.playoffs.years[year][opponent.recordManID]) {
								masterRecordBook.managers.playoffs.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.years[year][opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.years[year][opponent.recordManID]) {
								masterRecordBook.managers.combined.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.years[year][opponent.recordManID].push(comboEntry);
							
							const starters = opponent.starters;
							const startersPTS = opponent.starters_points.sort((a, b) => b - a);
							const numStarters = opponent.starters_points.length;
			
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
			
								if(!POplayerRecords[year]) {
									POplayerRecords[year] = {};
								}
								if(!POplayerRecords[year][opponent.recordManID]) {
									POplayerRecords[year][opponent.recordManID] = {};
								}
			
								const playerPoints = playersPTS[playerID];
			
								let topStarter = new Boolean (false);
								let bottomStarter = new Boolean (false);
								let starterRank;
								let PTSasStarter;
								let PTSonBench;
								let benched = new Boolean (true);
			
								if(starters.includes(playerID)) {
									benched = false;
									PTSasStarter = playerPoints;
									PTSonBench = 0;
									starterRank = startersPTS.indexOf(playerPoints) + 1;
									if(startersPTS[0] == playerPoints) {
										topStarter = true;
									} else if(startersPTS[startersPTS.length - 1] == playerPoints) {
										bottomStarter = true;
									}
								} else {
									benched = true;
									PTSonBench = playerPoints;
									PTSasStarter = 0;
									topStarter = false;
									bottomStarter = false;
									starterRank = null;
								}
								
								let playerInfo = playersInfo[playerID];
								let avatar = playerInfo.pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
	
								if(!POplayerRecords[year][opponent.recordManID][playerID]) {
									POplayerRecords[year][opponent.recordManID][playerID] = [];
								}
			
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: PTSasStarter,
									benchPoints: PTSonBench,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched,
									howAcquired: null,
									weekAcquired: null,
									topStarter,
									bottomStarter,
									starterRank,
									numStarters,
									starterRankAVG: null,
									playerInfo,
									avatar,
								}
			
								// right now, acquisitions is just a list of the manager's draft picks
								let acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(let i = 0; i < acquisitions.length; i++) {
									if(acquisitions[i].playerID == playerID) {
										playerEntry.howAcquired = 'draft';
										playerEntry.weekAcquired = 0;
									} 
								}
								POplayerRecords[year][opponent.recordManID][playerID].push(playerEntry);
	
								// add player arrays to ALLTIME

								masterRecordBook.players.league.playoffs.alltime.push(playerEntry);
								masterRecordBook.players.league.combined.alltime.push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.combined.alltime[opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.alltime[opponent.recordManID].push(playerEntry);

								// add player arrays to YEARS

								masterRecordBook.players.league.playoffs.years[year].push(playerEntry);
								masterRecordBook.players.league.combined.years[year].push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.combined.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.years[year][opponent.recordManID].push(playerEntry);
							}
						}
	
						playoffRosterRecords[home.recordManID].years[year].fptsAgainst += away.fpts;
						playoffRosterRecords[away.recordManID].years[year].fptsAgainst += home.fpts;
	
						if(POmatchupDifferential.differential == 0) {
							playoffRosterRecords[home.recordManID].years[year].ties++;
							playoffRosterRecords[away.recordManID].years[year].ties++;
						} else {
							playoffRosterRecords[home.recordManID].years[year].wins++;
							playoffRosterRecords[away.recordManID].years[year].losses++;
						}
					}
				} else if(playoffCase == 8 ||														// Relevant Match IDs: 1, 2, 3, 4
				   		  playoffCase == 2 ||
				   		  playoffCase == 5 && POstartWeek < POrecordsWeek + playoffLength) {

					for(let i = 1; i < 5; i++) {
						
						let home = POmatchups[i][0];
						let away = POmatchups[i][1];
						if(POmatchups[i][0].fpts < POmatchups[i][1].fpts) {
							home = POmatchups[i][1];
							away = POmatchups[i][0];
						}
	
						const POmatchupDifferential = {
							year: home.year,
							week: home.week,
							home: {
								manager: home.manager,
								fpts: home.fpts,
								recordManID: home.recordManID,
							},
							away: {
								manager: away.manager,
								fpts: away.fpts,
								recordManID: away.recordManID,
							},
							differential: home.fpts - away.fpts
						}
						allTimePOMatchupDifferentials.push(POmatchupDifferential);
						POmatchupDifferentials.push(POmatchupDifferential);
	
						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key];

							playoffRosterRecords[opponent.recordManID].years[year].fpts += opponent.fpts;
							playoffRosterRecords[opponent.recordManID].years[year].POgames++;
	
							const POweekEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								epePOWins: 0,
								epePOTies: 0,
								epePOLosses: 0,
								POweekWinner: new Boolean(false),
								POweekLoser: new Boolean(false),
								week: opponent.week,
								year,
							}

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: new Boolean(false),
								weekLoser: new Boolean(false),
								weekTie: new Boolean(false),
								medianPerc: null,
								topScore: new Boolean(false),
								bottomScore: new Boolean(false),
								week: opponent.week,
								year,
							}

							playoffPointsRecord.push(POweekEntry);

							masterRecordBook.league.playoffs.alltime.push(comboEntry);
							masterRecordBook.league.combined.alltime.push(comboEntry);
							if(!masterRecordBook.managers.playoffs.alltime[opponent.recordManID]) {
								masterRecordBook.managers.playoffs.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.alltime[opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.alltime[opponent.recordManID]) {
								masterRecordBook.managers.combined.alltime[opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.alltime[opponent.recordManID].push(comboEntry);
	
							masterRecordBook.league.playoffs.years[year].push(comboEntry);
							masterRecordBook.league.combined.years[year].push(comboEntry);
							if(!masterRecordBook.managers.playoffs.years[year][opponent.recordManID]) {
								masterRecordBook.managers.playoffs.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.playoffs.years[year][opponent.recordManID].push(comboEntry);
							if(!masterRecordBook.managers.combined.years[year][opponent.recordManID]) {
								masterRecordBook.managers.combined.years[year][opponent.recordManID] = [];
							}
							masterRecordBook.managers.combined.years[year][opponent.recordManID].push(comboEntry);

							const starters = opponent.starters;
							const startersPTS = opponent.starters_points.sort((a, b) => b - a);
							const numStarters = opponent.starters_points.length;
			
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
			
								if(!POplayerRecords[year]) {
									POplayerRecords[year] = {};
								}
								if(!POplayerRecords[year][opponent.recordManID]) {
									POplayerRecords[year][opponent.recordManID] = {};
								}
			
								const playerPoints = playersPTS[playerID];
			
								let topStarter = new Boolean (false);
								let bottomStarter = new Boolean (false);
								let starterRank;
								let PTSasStarter;
								let PTSonBench;
								let benched = new Boolean (true);
			
								if(starters.includes(playerID)) {
									benched = false;
									PTSasStarter = playerPoints;
									PTSonBench = 0;
									starterRank = startersPTS.indexOf(playerPoints) + 1;
									if(startersPTS[0] == playerPoints) {
										topStarter = true;
									} else if(startersPTS[startersPTS.length - 1] == playerPoints) {
										bottomStarter = true;
									}
								} else {
									benched = true;
									PTSonBench = playerPoints;
									PTSasStarter = 0;
									topStarter = false;
									bottomStarter = false;
									starterRank = null;
								}
								
								let playerInfo = playersInfo[playerID];
								let avatar = playerInfo.pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;
	
								if(!POplayerRecords[year][opponent.recordManID][playerID]) {
									POplayerRecords[year][opponent.recordManID][playerID] = [];
								}
			
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: PTSasStarter,
									benchPoints: PTSonBench,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched,
									howAcquired: null,
									weekAcquired: null,
									topStarter,
									bottomStarter,
									starterRank,
									numStarters,
									starterRankAVG: null,
									playerInfo,
									avatar,
								}
			
								// right now, acquisitions is just a list of the manager's draft picks
								let acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(let i = 0; i < acquisitions.length; i++) {
									if(acquisitions[i].playerID == playerID) {
										playerEntry.howAcquired = 'draft';
										playerEntry.weekAcquired = 0;
									} 
								}

								POplayerRecords[year][opponent.recordManID][playerID].push(playerEntry);
	
								// add player arrays to ALLTIME

								masterRecordBook.players.league.playoffs.alltime.push(playerEntry);
								masterRecordBook.players.league.combined.alltime.push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.playoffs.alltime[opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.alltime[opponent.recordManID]) {
									masterRecordBook.players.managers.combined.alltime[opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.alltime[opponent.recordManID].push(playerEntry);

								// add player arrays to YEARS

								masterRecordBook.players.league.playoffs.years[year].push(playerEntry);
								masterRecordBook.players.league.combined.years[year].push(playerEntry);
								if(!masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.playoffs.years[year][opponent.recordManID].push(playerEntry);
								if(!masterRecordBook.players.managers.combined.years[year][opponent.recordManID]) {
									masterRecordBook.players.managers.combined.years[year][opponent.recordManID] = [];
								}
								masterRecordBook.players.managers.combined.years[year][opponent.recordManID].push(playerEntry);
							}
						}
	
						playoffRosterRecords[home.recordManID].years[year].fptsAgainst += away.fpts;
						playoffRosterRecords[away.recordManID].years[year].fptsAgainst += home.fpts;
	
						if(POmatchupDifferential.differential == 0) {
							playoffRosterRecords[home.recordManID].years[year].ties++;
							playoffRosterRecords[away.recordManID].years[year].ties++;
						} else {
							playoffRosterRecords[home.recordManID].years[year].wins++;
							playoffRosterRecords[away.recordManID].years[year].losses++;
						}
					}
				}

				POstartWeek--;

			}

			if(!playoffPlayerRecords[year]) {
				playoffPlayerRecords[year] = {};
			}
			if(!playoffTeamPOSRecords[year]) {
				playoffTeamPOSRecords[year] = {};
			}

						// create team/pos objects, setting baseline at 0
			for(const recordManID in POplayerRecords[year]) {
				const POplayerRecord = POplayerRecords[year][recordManID];

				let	positionFPTS = {
					QB: 0,
					RB: 0,
					WR: 0,
					TE: 0,
					K: 0,
					DEF: 0,
					DL: 0,
					DE: 0,
					DT: 0,
					LB: 0,
					DB: 0,
					CB: 0,
					SS: 0,
					FS: 0,
				};
				let	teamFPTS = {
					ARI: 0,
					ATL: 0,
					BAL: 0,
					BUF: 0,
					CAR: 0,
					CHI: 0,
					CIN: 0,
					CLE: 0,
					DAL: 0,
					DEN: 0,
					DET: 0,
					GB: 0,
					HOU: 0,
					IND: 0,
					JAX: 0,
					KC: 0,
					LAC: 0,
					LAR: 0,
					LV: 0,
					MIA: 0,
					MIN: 0,
					NE: 0,
					NO: 0,
					NYG: 0,
					NYJ: 0,
					PHI: 0,
					PIT: 0,
					SEA: 0,
					SF: 0,
					TEN: 0,
					TB: 0,
					WAS: 0,
				};

				for(const playerID in POplayerRecord) {
					const playRec = POplayerRecord[playerID];

					for(let i = 0; i < playRec.length; i++) {

						if(playRec[i].benched == false) {

							teamFPTS[playRec[i].playerInfo.t] += playRec[i].playerPoints;
							positionFPTS[playRec[i].playerInfo.pos] += playRec[i].playerPoints;
						}
					}

					if(!playoffPlayerRecords[year][recordManID]) {
						playoffPlayerRecords[year][recordManID] = {};
					}
					if(!playoffPlayerRecords[year][recordManID][playerID]) {
						playoffPlayerRecords[year][recordManID][playerID] = {	
							recordManID,
							playerID,
							manager: originalManagers[recordManID],
							playerInfo: playersInfo[playerID],
							year,
						}
					}
				}

				if(!playoffTeamPOSRecords[year][recordManID]) {
					playoffTeamPOSRecords[year][recordManID] = {
						positionFPTS,
						teamFPTS,
						manager: originalManagers[recordManID],
						recordManID,
						year,
					}
				}
			}	


						// calculate playoff records

			for(const recordManID in playoffRosterRecords) {
				const playoffRosterRecord = playoffRosterRecords[recordManID];

				if(playoffRosterRecord.years[year] && playoffRosterRecord.years[year].POgames > 0) {

					playoffRosterRecord.fptsFor += playoffRosterRecord.years[year].fpts;
					playoffRosterRecord.fptsAgainst += playoffRosterRecord.years[year].fptsAgainst;
					playoffRosterRecord.wins += playoffRosterRecord.years[year].wins;
					playoffRosterRecord.ties += playoffRosterRecord.years[year].ties;
					playoffRosterRecord.losses += playoffRosterRecord.years[year].losses;
					playoffRosterRecord.POgames += playoffRosterRecord.years[year].POgames;
					playoffRosterRecord.potentialPoints += playoffRosterRecord.years[year].potentialPoints;
				
					const fptspg = playoffRosterRecord.years[year].fpts / playoffRosterRecord.years[year].POgames;

				} else {
					continue;
				}
			}
			

			POmatchupDifferentials = POmatchupDifferentials.sort((a, b) => b.differential - a.differential);
			const biggestPOBlowouts = POmatchupDifferentials.slice(0, 10);

			const closestPOMatchups = [];
			for(let i = 0; i < 10; i++) {
				closestPOMatchups.push(POmatchupDifferentials.pop());
			}

			// per-season ranks & records to push thru seasonWeekRecords
			const interSeasonPOEntry = {
				year,
				biggestPOBlowouts,
				closestPOMatchups,
				playoffPointsRecords: playoffPointsRecord.sort((a, b) => b.fpts - a.fpts).slice(0, 10),
			}

			if(interSeasonPOEntry.playoffPointsRecords.length > 0) {
				if(!currentYear) {
					currentYear = year;
				}
				playoffWeekRecords.push(interSeasonPOEntry);
			};
		}
		
		// process all the REGULAR SEASON matchups
		for(const matchupWeek of matchupsData) {
			let matchups = {};

			for(const matchup of matchupWeek) {

				let recordManager = leagueManagers[matchup.roster_id].filter(m => m.yearsactive.includes(year));
				let recordManID = recordManager[0].managerID;

				const entry = {
					manager: originalManagers[recordManID],
					fpts: matchup.points,
					week: startWeek,
					year,
					rosterID: matchup.roster_id,
					epeWins: 0,
					epeTies: 0,
					epeLosses: 0,
					weekWinner: new Boolean(false),
					weekLoser: new Boolean(false),
					recordManID,
				}

				const comboEntry = {
					manager: originalManagers[recordManID],
					recordManID,
					rosterID: matchup.roster_id,
					fpts: matchup.points,
					fptspg: null,
					epeWins: 0,
					epeTies: 0,
					epeLosses: 0,
					epePerc: 0,
					weekWinner: new Boolean(false),
					weekLoser: new Boolean(false),
					weekTie: new Boolean(false),
					medianPerc: null,
					topScore: new Boolean(false),
					bottomScore: new Boolean(false),
					week: startWeek,
					year,
				}

				masterRecordBook.league.regularSeason.alltime.push(comboEntry);
				masterRecordBook.league.combined.alltime.push(comboEntry);				
				if(!masterRecordBook.managers.regularSeason.alltime[recordManID]) {
					masterRecordBook.managers.regularSeason.alltime[recordManID] = [];
				}
				masterRecordBook.managers.regularSeason.alltime[recordManID].push(comboEntry);
				if(!masterRecordBook.managers.combined.alltime[recordManID]) {
					masterRecordBook.managers.combined.alltime[recordManID] = [];
				}
				masterRecordBook.managers.combined.alltime[recordManID].push(comboEntry);

				masterRecordBook.league.regularSeason.years[year].push(comboEntry);
				masterRecordBook.league.combined.years[year].push(comboEntry);
				if(!masterRecordBook.managers.regularSeason.years[year][recordManID]) {
					masterRecordBook.managers.regularSeason.years[year][recordManID] = [];
				}
				masterRecordBook.managers.regularSeason.years[year][recordManID].push(comboEntry);
				if(!masterRecordBook.managers.combined.years[year][recordManID]) {
					masterRecordBook.managers.combined.years[year][recordManID] = [];
				}
				masterRecordBook.managers.combined.years[year][recordManID].push(comboEntry);
	
				// add each entry to the matchup object
				if(!matchups[matchup.matchup_id]) {
					matchups[matchup.matchup_id] = [];
				}
				matchups[matchup.matchup_id].push(entry);

				const starters = matchup.starters;
				const startersPTS = matchup.starters_points.sort((a, b) => b - a);
				const numStarters = matchup.starters_points.length;

				const players = matchup.players;
				const playersPTS = matchup.players_points;
				
				for(let i = 0; i < players.length; i++) {

					const playerID = players[i];

					if(!playerRecords[year]) {
						playerRecords[year] = {};
					}
					if(!playerRecords[year][recordManID]) {
						playerRecords[year][recordManID] = {};
					}

					const playerPoints = playersPTS[playerID];

					let topStarter = new Boolean (false);
					let bottomStarter = new Boolean (false);
					let starterRank;
					let PTSasStarter;
					let PTSonBench;
					let benched = new Boolean (true);

					if(starters.includes(playerID)) {
						benched = false;
						PTSasStarter = playerPoints;
						PTSonBench = 0;
						starterRank = startersPTS.indexOf(playerPoints) + 1;
						if(startersPTS[0] == playerPoints) {
							topStarter = true;
						} else if(startersPTS[startersPTS.length - 1] == playerPoints) {
							bottomStarter = true;
						}
					} else {
						benched = true;
						PTSonBench = playerPoints;
						PTSasStarter = 0;
						topStarter = false;
						bottomStarter = false;
						starterRank = null;
					}
					
					let playerInfo = playersInfo[playerID];
    				let avatar = playerInfo.pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png)` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp)`;

					if(!playerRecords[year][recordManID][playerID]) {
						playerRecords[year][recordManID][playerID] = [];
					}

					const playerEntry = {		
						recordManID,
						manager: originalManagers[recordManID],
						week: startWeek,
						year,
						rosterID: matchup.roster_id,
						playerID,
						playerPoints: PTSasStarter,
						benchPoints: PTSonBench,
						weeksStarted: null,
						weeksBenched: null,
						weeksOwned: null,
						benched,
						howAcquired: null,
						weekAcquired: null,
						topStarter,
						bottomStarter,
						starterRank,
						numStarters,
						starterRankAVG: null,
						playerInfo,
						avatar,
					}

					// right now, acquisitions is just a list of the manager's draft picks
					let acquisitions = acquisitionRecords[year][recordManID];
					for(let i = 0; i < acquisitions.length; i++) {
						if(acquisitions[i].playerID == playerID) {
							playerEntry.howAcquired = 'draft';
							playerEntry.weekAcquired = 0;
						} 
					}
					playerRecords[year][recordManID][playerID].push(playerEntry);

					// add player arrays to ALLTIME

					masterRecordBook.players.league.regularSeason.alltime.push(playerEntry);
					masterRecordBook.players.league.combined.alltime.push(playerEntry);
					if(!masterRecordBook.players.managers.regularSeason.alltime[recordManID]) {
						masterRecordBook.players.managers.regularSeason.alltime[recordManID] = [];
					}
					masterRecordBook.players.managers.regularSeason.alltime[recordManID].push(playerEntry);
					if(!masterRecordBook.players.managers.combined.alltime[recordManID]) {
						masterRecordBook.players.managers.combined.alltime[recordManID] = [];
					}
					masterRecordBook.players.managers.combined.alltime[recordManID].push(playerEntry);

					// add player arrays to YEARS

					masterRecordBook.players.league.regularSeason.years[year].push(playerEntry);
					masterRecordBook.players.league.combined.years[year].push(playerEntry);
					if(!masterRecordBook.players.managers.regularSeason.years[year][recordManID]) {
						masterRecordBook.players.managers.regularSeason.years[year][recordManID] = [];
					}
					masterRecordBook.players.managers.regularSeason.years[year][recordManID].push(playerEntry);
					if(!masterRecordBook.players.managers.combined.years[year][recordManID]) {
						masterRecordBook.players.managers.combined.years[year][recordManID] = [];
					}
					masterRecordBook.players.managers.combined.years[year][recordManID].push(playerEntry);

					
				}
				
			}
			startWeek--;
			
					      
			// create matchup differentials from matchups obj
			for(const matchupKey in matchups) {
				const matchup = matchups[matchupKey];
				let home = matchup[0];
				let away = matchup[1];
				if(matchup[0].fpts < matchup[1].fpts) {
					home = matchup[1];
					away = matchup[0];
				}
				const matchupDifferential = {
					year: home.year,
					week: home.week,
					home: {
						manager: home.manager,
						fpts: home.fpts,
						recordManID: home.recordManID,
					},
					away: {
						manager: away.manager,
						fpts: away.fpts,
						recordManID: away.recordManID,
					},
					differential: home.fpts - away.fpts
				}
				allTimeMatchupDifferentials.push(matchupDifferential);
				matchupDifferentials.push(matchupDifferential);
			}
		}

		// first time around, create per-season objects for season-long player & team/pos records
		if(!seasonPlayerRecords[year]) {
			seasonPlayerRecords[year] = {};
		}
		if(!seasonTeamPOSRecords[year]) {
			seasonTeamPOSRecords[year] = {};
		}

		// create team/pos objects, setting baseline at 0
		for(const recordManID in playerRecords[year]) {
			const playerRecord = playerRecords[year][recordManID];

			let	positionFPTS = {
				QB: 0,
				RB: 0,
				WR: 0,
				TE: 0,
				K: 0,
				DEF: 0,
				DL: 0,
				DE: 0,
				DT: 0,
				LB: 0,
				DB: 0,
				CB: 0,
				SS: 0,
				FS: 0,
			};
			let	teamFPTS = {
				ARI: 0,
				ATL: 0,
				BAL: 0,
				BUF: 0,
				CAR: 0,
				CHI: 0,
				CIN: 0,
				CLE: 0,
				DAL: 0,
				DEN: 0,
				DET: 0,
				GB: 0,
				HOU: 0,
				IND: 0,
				JAX: 0,
				KC: 0,
				LAC: 0,
				LAR: 0,
				LV: 0,
				MIA: 0,
				MIN: 0,
				NE: 0,
				NO: 0,
				NYG: 0,
				NYJ: 0,
				PHI: 0,
				PIT: 0,
				SEA: 0,
				SF: 0,
				TEN: 0,
				TB: 0,
				WAS: 0,
			};

			for(const playerID in playerRecord) {
				const playRec = playerRecord[playerID];
				
				// season-long ranks & records

				for(let i = 0; i < playRec.length; i++) {

					if(playRec[i].benched == false) {

						teamFPTS[playRec[i].playerInfo.t] += playRec[i].playerPoints;
						positionFPTS[playRec[i].playerInfo.pos] += playRec[i].playerPoints;

					}
				}

				if(!seasonPlayerRecords[year][recordManID]) {
					seasonPlayerRecords[year][recordManID] = {};
				}
				if(!seasonPlayerRecords[year][recordManID][playerID]) {
					seasonPlayerRecords[year][recordManID][playerID] = {	
						recordManID,
						playerID,
						manager: originalManagers[recordManID],
						playerInfo: playersInfo[playerID],
						year,
					}
				}
			}

			if(!seasonTeamPOSRecords[year][recordManID]) {
				seasonTeamPOSRecords[year][recordManID] = {
					positionFPTS,
					teamFPTS,
					manager: originalManagers[recordManID],
					recordManID,
					year,
				}
			}
		}	
		
		// create season-record arrays 
		let weekBests = [];						// ranking all managers' personal best week of season
		let weekWorsts = [];
		let playoffWeekBests = [];
		let playoffWeekWorsts = [];					// ranking......personal worst.....
		let combinedWeekBests = [];
		let combinedWeekWorsts = [];
		let playerSeasonTOPS = [];				// top 10 player season-long scores
		let	playerSeasonBests = [];				// ranking all manager's highest-scoring player (season)
		let playerPlayoffBests = [];
		let playerCombinedBests = [];

		let	playerWeekBests = [];				// ranking all manager's highest-scoring player (week)
		let playerPlayoffWeekBests = [];
		let playerCombinedWeekBests = [];
		let	playerWeekMissedBests = [];				// ranking all manager's highest-scoring player (week)
		let playerPlayoffWeekMissedBests = [];
		let playerCombinedWeekMissedBests = [];

		// calculate season records
		for(const recordManID in masterRecordBook.managers.regularSeason.years[year]) {
			const recordMan = masterRecordBook.managers.regularSeason.years[year][recordManID];
			weekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]); //regSeasonWeekBests
			weekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]); //regSeasonWeekWorsts
		}
		for(const recordManID in masterRecordBook.managers.playoffs.years[year]) {
			const recordMan = masterRecordBook.managers.playoffs.years[year][recordManID];
			playoffWeekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]);
			playoffWeekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]);
		}
		for(const recordManID in masterRecordBook.managers.combined.years[year]) {
			const recordMan = masterRecordBook.managers.combined.years[year][recordManID];
			combinedWeekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]);
			combinedWeekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]);
		}
		weekBests = weekBests.sort((a, b) => b.fpts - a.fpts);
		weekWorsts = weekWorsts.sort((a, b) => b.fpts - a.fpts);
		playoffWeekBests = playoffWeekBests.sort((a, b) => b.fpts - a.fpts);
		playoffWeekWorsts = playoffWeekWorsts.sort((a, b) => b.fpts - a.fpts);
		combinedWeekBests = combinedWeekBests.sort((a, b) => b.fpts - a.fpts);
		combinedWeekWorsts = combinedWeekWorsts.sort((a, b) => b.fpts - a.fpts);

		for(const recordType in masterRecordBook.managers) {
			const typeRecord = masterRecordBook.managers[recordType];

			if(recordType != "totals" && recordType != "grandTotals") {

				if(!masterRecordBook.league.totals.years[year][recordType]) {
					masterRecordBook.league.totals.years[year][recordType] = [];
				}
				if(!masterRecordBook.league.totals.alltime[recordType]) {
					masterRecordBook.league.totals.alltime[recordType] = [];
				}

				if(typeRecord.years[year].length > 0) {
					for(const recordManID in typeRecord.years[year]) {
						const recordMan = typeRecord.years[year][recordManID];

						let fptsTotal = 0;
						let epeWinsTotal = 0;
						let epeTiesTotal = 0;
						let epeLossesTotal = 0;
						let weekWinners = 0;
						let weekLosers = 0;
						let weekTies = 0;
						let topScores = 0;
						let bottomScores = 0;
						// looping thru each week in that year
						for(let i = 0; i < recordMan.length; i++) {
							// add each week's score to running total
							fptsTotal += recordMan[i].fpts;
							// compare score to other scores from that week
							const compareWins = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts < recordMan[i].fpts);
							const compareLosses = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts > recordMan[i].fpts);
							const compareTies = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts == recordMan[i].fpts && p.recordManID != recordMan[i].recordManID);
							// add EPE stats to running totals
							const epeWins = compareWins.length;
							const epeLosses = compareLosses.length;
							const epeTies = compareTies.length;
							epeWinsTotal += epeWins;
							epeLossesTotal += epeLosses;
							epeTiesTotal += epeTies;
							// update that week's EPE stats in league & manager records
							const epePerc = (epeWins + epeTies / 2) / (epeWins + epeTies + epeLosses) * 100;
							masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].epeWins = epeWins;
							masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].epeLosses = epeLosses;
							masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].epeTies = epeTies;
							masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].epePerc = epePerc;
							// determine if top score of week AND update that week's entry in league & manager records
							if(epeLosses == 0) {			
								topScores++;
								masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].topScore = true;
							} else if(epeWins == 0) {
								bottomScores++;
								masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].bottomScore = true;
							}
							// determine if beat median score AND update that week's entry in league & manager records
							let scoresArray = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week);
							const numScores = scoresArray.length;
							scoresArray = scoresArray.sort((a, b) => b.fpts - a.fpts).slice(numScores / 2 - 1, numScores / 2 + 1);
							const medianScore = (scoresArray[0].fpts + scoresArray[1].fpts) / 2;
							if(recordMan[i].fpts > medianScore) {
								weekWinners++;
								masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].weekWinner = true;
							} else if(recordMan[i].fpts < medianScore) {
								weekLosers++;
								masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].weekLoser = true;
							} else if(recordMan[i].fpts == medianScore) {
								weekTies++;
								masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID)[0].weekTie = true;
							}
						}

						const totalPPG = fptsTotal / recordMan.length; 
						const epePerc = (epeWinsTotal + epeTiesTotal / 2) / (epeWinsTotal + epeTiesTotal + epeLossesTotal) * 100;
						const medianPerc = (weekWinners + weekTies / 2) / (weekWinners + weekTies + weekLosers) * 100;
						const comboEntry = {
							manager: recordMan[0].manager,
							recordManID,
							rosterID: recordMan[0].rosterID,
							fpts: fptsTotal,
							fptspg: totalPPG,
							epeWins: epeWinsTotal,
							epeTies: epeTiesTotal,
							epeLosses: epeLossesTotal,
							epePerc,
							weekWinners,
							weekLosers,
							weekTies,
							medianPerc,
							topScores,
							bottomScores,
							week: null,
							year,
						}

						if(!masterRecordBook.managers.totals.years[year][recordManID]) {
							masterRecordBook.managers.totals.years[year][recordManID] = {
								regularSeason: [],
								playoffs: [],
								combined: [],
							}
						}
						if(!masterRecordBook.managers.totals.alltime[recordManID]) {
							masterRecordBook.managers.totals.alltime[recordManID] = {
								regularSeason: [],
								playoffs: [],
								combined: [],
							}
						}
						masterRecordBook.managers.totals.years[year][recordManID][recordType].push(comboEntry);
						masterRecordBook.league.totals.years[year][recordType].push(comboEntry);

						masterRecordBook.managers.totals.alltime[recordManID][recordType].push(comboEntry);
						masterRecordBook.league.totals.alltime[recordType].push(comboEntry);
					}
				} 
			}
		}

		for(const recordManID in masterRecordBook.players.managers.regularSeason.years[year]) {
			const recordMan = masterRecordBook.players.managers.regularSeason.years[year][recordManID];
			playerWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); 
			playerWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); 
		}
		for(const recordManID in masterRecordBook.players.managers.playoffs.years[year]) {
			const recordMan = masterRecordBook.players.managers.playoffs.years[year][recordManID];
			if(recordMan.length > 0) {
				playerPlayoffWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
				playerPlayoffWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); 
			}
		}
		for(const recordManID in masterRecordBook.players.managers.combined.years[year]) {
			const recordMan = masterRecordBook.players.managers.combined.years[year][recordManID];
			playerCombinedWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
			playerCombinedWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); 
		}
		playerWeekBests = playerWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
		playerPlayoffWeekBests = playerPlayoffWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
		playerCombinedWeekBests = playerCombinedWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
		playerWeekMissedBests = playerWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);
		playerPlayoffWeekMissedBests = playerPlayoffWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);
		playerCombinedWeekMissedBests = playerCombinedWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);

		for(const recordType in masterRecordBook.players.managers) {
			const typeRecord = masterRecordBook.players.managers[recordType];

			if(recordType != "totals" && recordType != "grandTotals") {

				if(!masterRecordBook.players.league.totals.years[year][recordType]) {
					masterRecordBook.players.league.totals.years[year][recordType] = [];
				}
				if(!masterRecordBook.players.league.totals.alltime[recordType]) {
					masterRecordBook.players.league.totals.alltime[recordType] = [];
				}

				if(typeRecord.years[year].length > 0) {
					for(const recordManID in typeRecord.years[year]) {
						const recordMan = typeRecord.years[year][recordManID];
						
						let playerTotals = {};
						let uniqueStarters = 0;

						for(const key in recordMan) {
							const player = recordMan[key];

							if(!playerTotals[player.playerID]) {
								playerTotals[player.playerID] = {
									recordManID,
									manager: player.manager,
									week: null,
									year,
									rosterID: player.rosterID,
									playerID: player.playerID,
									playerPoints: 0,
									playerPPStart: 0,
									benchPoints: 0,
									weeksStarted: 0,
									weeksBenched: 0,
									weeksOwned: 0,
									benched: null,
									howAcquired: null,
									weekAcquired: null,
									topStarters: 0,
									bottomStarters: 0,
									starterRank: null,
									numStarters: null,
									starterRankAVG: null,
									starterRanks: 0,
									playerInfo: player.playerInfo,
									avatar: player.avatar,
								}
								if(player.benched == false) {
									uniqueStarters++;
								}
							}
							playerTotals[player.playerID].weeksOwned++;
							if(player.benched == false) {
								playerTotals[player.playerID].playerPoints += player.playerPoints;
								playerTotals[player.playerID].weeksStarted++;
								playerTotals[player.playerID].starterRanks += player.starterRank;
								if(player.topStarter == true) {
									playerTotals[player.playerID].topStarters++;
								} else if(player.bottomStarter == true) {
									playerTotals[player.playerID].bottomStarters++;
								}
							} else if(player.benched == true) {
								playerTotals[player.playerID].benchPoints += player.playerPoints;
								playerTotals[player.playerID].weeksBenched++;
							}
						}

						for(const playerID in playerTotals) {
							const player = playerTotals[playerID];
						
							player.numStarters = uniqueStarters;
							if(player.weeksStarted > 0) {
								player.playerPPStart = player.playerPoints / player.weeksStarted;
								player.starterRankAVG = player.starterRanks / player.weeksStarted;
							} else {
								player.playerPPStart = 0;
								player.starterRankAVG = 0;
							}

							if(!masterRecordBook.players.managers.totals.playerIDs[playerID]) {
								masterRecordBook.players.managers.totals.playerIDs[playerID] = {
									regularSeason: [],
									playoffs: [],
									combined: [],
								}
							}
							masterRecordBook.players.managers.totals.playerIDs[playerID][recordType].push(player);
							if(!masterRecordBook.players.managers.totals.years[year][recordManID]) {
								masterRecordBook.players.managers.totals.years[year][recordManID] = {
									regularSeason: [],
									playoffs: [],
									combined: [],
								}
							}
							if(!masterRecordBook.players.managers.totals.alltime[recordManID]) {
								masterRecordBook.players.managers.totals.alltime[recordManID] = {
									regularSeason: [],
									playoffs: [],
									combined: [],
								}
							}
							masterRecordBook.players.managers.totals.years[year][recordManID][recordType].push(player);
							masterRecordBook.players.league.totals.years[year][recordType].push(player);

							masterRecordBook.players.managers.totals.alltime[recordManID][recordType].push(player);
							masterRecordBook.players.league.totals.alltime[recordType].push(player);
						}
					}
				}
			}
		}

		for(const recordManID in masterRecordBook.players.managers.totals.years[year]) {
			const recordMan = masterRecordBook.players.managers.totals.years[year][recordManID].regularSeason;
			playerSeasonBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); 
		}
		for(const recordManID in masterRecordBook.players.managers.totals.years[year]) {
			const recordMan = masterRecordBook.players.managers.totals.years[year][recordManID].playoffs;
			if(recordMan.length > 0) {
				playerPlayoffBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
			}
		}
		for(const recordManID in masterRecordBook.players.managers.totals.years[year]) {
			const recordMan = masterRecordBook.players.managers.totals.years[year][recordManID].combined;
			playerCombinedBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
		}
		playerSeasonBests = playerSeasonBests.sort((a, b) => b.playerPoints - a.playerPoints);
		playerPlayoffBests = playerPlayoffBests.sort((a, b) => b.playerPoints - a.playerPoints);
		playerCombinedBests = playerCombinedBests.sort((a, b) => b.playerPoints - a.playerPoints);

		matchupDifferentials = matchupDifferentials.sort((a, b) => b.differential - a.differential);
		const biggestBlowouts = matchupDifferentials.slice(0, 10);

		const closestMatchups = [];
		for(let i = 0; i < 10; i++) {
			closestMatchups.push(matchupDifferentials.pop());
		}

		// per-season ranks & records to push thru seasonWeekRecords
		const interSeasonEntry = {
			year,
			biggestBlowouts,
			closestMatchups,
			weekBests,
			weekWorsts,
			playoffWeekBests,
			playoffWeekWorsts,
			combinedWeekBests,
			combinedWeekWorsts,
			seasonBests: masterRecordBook.league.totals.years[year].regularSeason.slice().sort((a, b) => b.fptspg - a.fptspg), //regSeasonBests
			seasonWorsts: masterRecordBook.league.totals.years[year].regularSeason.slice().sort((a, b) => b.fptspg - a.fptspg), //regSeasonWorsts
			playoffBests: masterRecordBook.league.totals.years[year].playoffs.slice().sort((a, b) => b.fptspg - a.fptspg),
			playoffWorsts: masterRecordBook.league.totals.years[year].playoffs.slice().sort((a, b) => b.fptspg - a.fptspg),
			combinedBests: masterRecordBook.league.totals.years[year].combined.slice().sort((a, b) => b.fptspg - a.fptspg),
			combinedWorsts: masterRecordBook.league.totals.years[year].combined.slice().sort((a, b) => b.fptspg - a.fptspg),
			seasonEPERecords: masterRecordBook.league.totals.years[year].regularSeason.slice().sort((a, b) => b.epePerc - a.epePerc),
			combinedEPERecords: masterRecordBook.league.totals.years[year].combined.slice().sort((a, b) => b.epePerc - a.epePerc),
			playoffEPERecords: masterRecordBook.league.totals.years[year].playoffs.slice().sort((a, b) => b.epePerc - a.epePerc),
			seasonMedianRecords: masterRecordBook.league.totals.years[year].regularSeason.slice().sort((a, b) => b.medianPerc - a.medianPerc),
			combinedMedianRecords: masterRecordBook.league.totals.years[year].combined.slice().sort((a, b) => b.medianPerc - a.medianPerc),
			playoffMedianRecords: masterRecordBook.league.totals.years[year].playoffs.slice().sort((a, b) => b.medianPerc - a.medianPerc),
			playerSeasonTOPS: masterRecordBook.players.league.totals.years[year].regularSeason.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerPlayoffTOPS: masterRecordBook.players.league.totals.years[year].playoffs.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerCombinedTOPS: masterRecordBook.players.league.totals.years[year].combined.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerSeasonBests,
			playerPlayoffBests,
			playerCombinedBests,
			playerWeekTOPS: masterRecordBook.players.league.regularSeason.years[year].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerWeekCombinedTOPS: masterRecordBook.players.league.combined.years[year].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerWeekPlayoffTOPS: masterRecordBook.players.league.playoffs.years[year].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			playerWeekMissedTOPS: masterRecordBook.players.league.regularSeason.years[year].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10),
			playerWeekCombinedMissedTOPS: masterRecordBook.players.league.combined.years[year].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10),
			playerWeekPlayoffMissedTOPS: masterRecordBook.players.league.playoffs.years[year].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10),
			playerWeekBests,
			playerPlayoffWeekBests,
			playerCombinedWeekBests,
			playerWeekMissedBests,
			playerPlayoffWeekMissedBests,
			playerCombinedWeekMissedBests,
			combinedPointsRecords: masterRecordBook.league.combined.years[year].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
			combinedPointsLows: masterRecordBook.league.combined.years[year].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
			playoffsPointsRecords: masterRecordBook.league.playoffs.years[year].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
			playoffsPointsLows: masterRecordBook.league.playoffs.years[year].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
			seasonPointsRecords: masterRecordBook.league.regularSeason.years[year].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
			seasonPointsLows: masterRecordBook.league.regularSeason.years[year].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
		}

		if(interSeasonEntry.seasonPointsRecords.length > 0) {
			if(!currentYear) {
				currentYear = year;
			}
			seasonWeekRecords.push(interSeasonEntry);
		};
		
	} // SEASON LOOPS HERE
	
	// calculate all-time records involving multi-season cumulative stats
	for(const recordManID in masterRecordBook.managers.totals.alltime) {
		const recordMan = masterRecordBook.managers.totals.alltime[recordManID];

		if(!masterRecordBook.managers.grandTotals[recordManID]) {
			masterRecordBook.managers.grandTotals[recordManID] = {
				regularSeason: [],
				playoffs: [],
				combined: [],
			}
		}

		for(const recordType in recordMan) {
			const typeRecord = recordMan[recordType];

			if(typeRecord.length > 0 && recordType != "totals" && recordType != "grandTotals") {
				
				let fptsTotal = 0;
				let epeWinsTotal = 0;
				let epeTiesTotal = 0;
				let epeLossesTotal = 0;
				let weekWinners = 0;
				let weekLosers = 0;
				let weekTies = 0;
				let topScores = 0;
				let bottomScores = 0;
				// looping thru totals from each regSeason, playoff, & combined regSeason+playoff
				for(let i = 0; i < typeRecord.length; i++) {
					fptsTotal += typeRecord[i].fpts;
					epeWinsTotal += typeRecord[i].epeWins;
					epeTiesTotal += typeRecord[i].epeTies;
					epeLossesTotal += typeRecord[i].epeLosses;
					weekWinners += typeRecord[i].weekWinners;
					weekLosers += typeRecord[i].weekLosers;
					weekTies += typeRecord[i].weekTies;
					topScores += typeRecord[i].topScores;
					bottomScores += typeRecord[i].bottomScores;
				}
				// determine all-time PPG, epe W%, median W% for ALL regSeason, PO, & combined
				const totalPPG = fptsTotal / (weekWinners + weekTies + weekLosers);  		// denominator is equal to # of games played for this record type
				const epePerc = (epeWinsTotal + epeTiesTotal / 2) / (epeWinsTotal + epeTiesTotal + epeLossesTotal) * 100;
				const medianPerc = (weekWinners + weekTies / 2) / (weekWinners + weekTies + weekLosers) * 100;

				const comboEntry = {
					manager: typeRecord[0].manager,
					recordManID,
					rosterID: typeRecord[0].rosterID,
					fpts: fptsTotal,
					fptspg: totalPPG,
					epeWins: epeWinsTotal,
					epeTies: epeTiesTotal,
					epeLosses: epeLossesTotal,
					epePerc,
					weekWinners,
					weekLosers,
					weekTies,
					medianPerc,
					topScores,
					bottomScores,
					week: null,
					year: null,
				}

				masterRecordBook.managers.grandTotals[recordManID][recordType].push(comboEntry);
				masterRecordBook.league.grandTotals[recordType].push(comboEntry);
			}
		}
	}

	// Sorting - COMBINED 
	let alltimeCombinedRecords = masterRecordBook.league.totals.alltime.combined.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10);
	let alltimeCombinedLows = masterRecordBook.league.totals.alltime.combined.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10);
	let alltimeCombinedBests = [];
	let alltimeCombinedWorsts = [];
	for(const recordManID in masterRecordBook.managers.totals.alltime) {
		const recordMan = masterRecordBook.managers.totals.alltime[recordManID].combined;
		alltimeCombinedBests.push(recordMan.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 1)[0]);
		alltimeCombinedWorsts.push(recordMan.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 1)[0]);
	}
	alltimeCombinedBests = alltimeCombinedBests.sort((a, b) => b.fptspg - a.fptspg);
	alltimeCombinedWorsts = alltimeCombinedWorsts.sort((a, b) => b.fptspg - a.fptspg);
	let alltimeCombinedWeekRecords = masterRecordBook.league.combined.alltime.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10);
	let alltimeCombinedWeekLows = masterRecordBook.league.combined.alltime.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10);
	let alltimeCombinedWeekBests = [];
	let alltimeCombinedWeekWorsts = [];
	for(const recordManID in masterRecordBook.managers.combined.alltime) {
		const recordMan = masterRecordBook.managers.combined.alltime[recordManID];
		alltimeCombinedWeekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]); 
		alltimeCombinedWeekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]); 
	}
	alltimeCombinedWeekBests = alltimeCombinedWeekBests.sort((a, b) => b.fpts - a.fpts);
	alltimeCombinedWeekWorsts = alltimeCombinedWeekWorsts.sort((a, b) => b.fpts - a.fpts);

	let alltimeCombinedEPERecords = masterRecordBook.league.grandTotals.combined.slice().sort((a, b) => b.epePerc - a.epePerc);
	let alltimeCombinedMedianRecords = masterRecordBook.league.grandTotals.combined.slice().sort((a, b) => b.medianPerc - a.medianPerc);
	let alltimeCombinedCumulativePoints = masterRecordBook.league.grandTotals.combined.slice().sort((a, b) => b.fptspg - a.fptspg);

	let playerATCombinedWeekBests = [];
	let playerATCombinedWeekMissedBests = [];
	for(const recordManID in masterRecordBook.players.managers.combined.alltime) {
		const recordMan = masterRecordBook.players.managers.combined.alltime[recordManID];
		playerATCombinedWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); 
		playerATCombinedWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); //alltimeRegSeasonWeekWorst
	}
	playerATCombinedWeekBests = playerATCombinedWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
	playerATCombinedWeekMissedBests = playerATCombinedWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);

	let playerATCombinedWeekTOPS = masterRecordBook.players.league.combined.alltime.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	let playerATCombinedWeekMissedTOPS = masterRecordBook.players.league.combined.alltime.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10);
	let playerATCombinedTOPS = masterRecordBook.players.league.totals.alltime.combined.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	let playerATCombinedBests = [];
	for(const recordManID in masterRecordBook.players.managers.totals.alltime) {
		const recordMan = masterRecordBook.players.managers.totals.alltime[recordManID].combined;
		playerATCombinedBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
	}
	playerATCombinedBests = playerATCombinedBests.sort((a, b) => b.playerPoints - a.playerPoints);


	// Sorting - REGULAR SEASON
	for(const recordManID in masterRecordBook.managers.regularSeason.alltime) {
		const recordMan = masterRecordBook.managers.regularSeason.alltime[recordManID];
		allTimeWeekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]); //alltimeRegSeasonWeekBest
		allTimeWeekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]); //alltimeRegSeasonWeekWorst
	}
	allTimeWeekBests = allTimeWeekBests.sort((a, b) => b.fpts - a.fpts);
	allTimeWeekWorsts = allTimeWeekWorsts.sort((a, b) => b.fpts - a.fpts);

	for(const recordManID in masterRecordBook.managers.totals.alltime) {
		const recordMan = masterRecordBook.managers.totals.alltime[recordManID].regularSeason;
		allTimeSeasonBests.push(recordMan.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 1)[0]);
		allTimeSeasonWorsts.push(recordMan.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 1)[0]);
	}
	allTimeSeasonBests = allTimeSeasonBests.sort((a, b) => b.fptspg - a.fptspg);
	allTimeSeasonWorsts = allTimeSeasonWorsts.sort((a, b) => b.fptspg - a.fptspg);

	allTimeEPERecords = masterRecordBook.league.grandTotals.regularSeason.slice().sort((a, b) => b.epePerc - a.epePerc);
	let alltimeMedianRecords = masterRecordBook.league.grandTotals.regularSeason.slice().sort((a, b) => b.medianPerc - a.medianPerc);
	let alltimeCumulativePoints = masterRecordBook.league.grandTotals.regularSeason.slice().sort((a, b) => b.fptspg - a.fptspg);

	allTimeMatchupDifferentials = allTimeMatchupDifferentials.sort((a, b) => b.differential - a.differential);
	allTimeBiggestBlowouts = allTimeMatchupDifferentials.slice(0, 10);

	for(let i = 0; i < 10; i++) {
		allTimeClosestMatchups.push(allTimeMatchupDifferentials.pop());
	}
	
	leagueWeekRecords = masterRecordBook.league.regularSeason.alltime.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10);
	leagueWeekLows = masterRecordBook.league.regularSeason.alltime.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10);
	mostSeasonLongPoints = masterRecordBook.league.totals.alltime.regularSeason.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10);
	leastSeasonLongPoints = masterRecordBook.league.totals.alltime.regularSeason.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10);

	for(const recordManID in masterRecordBook.players.managers.regularSeason.alltime) {
		const recordMan = masterRecordBook.players.managers.regularSeason.alltime[recordManID];
		playerATWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); //alltimeRegSeasonWeekBest
		playerATWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); //alltimeRegSeasonWeekWorst
	}
	playerATWeekBests = playerATWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
	playerATWeekMissedBests = playerATWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);
	for(const recordManID in masterRecordBook.players.managers.totals.alltime) {
		const recordMan = masterRecordBook.players.managers.totals.alltime[recordManID].regularSeason;
		playerATSeasonBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); 
	}
	playerATSeasonBests = playerATSeasonBests.sort((a, b) => b.playerPoints - a.playerPoints);
	playerATSeasonTOPS = masterRecordBook.players.league.totals.alltime.regularSeason.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	playerATWeekTOPS = masterRecordBook.players.league.regularSeason.alltime.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	playerATWeekMissedTOPS = masterRecordBook.players.league.regularSeason.alltime.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10);

	// Sorting - PLAYOFFS
	let alltimePlayoffRecords = masterRecordBook.league.totals.alltime.playoffs.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10);
	let alltimePlayoffLows = masterRecordBook.league.totals.alltime.playoffs.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10);

	for(const recordManID in masterRecordBook.managers.playoffs.alltime) {
		const recordMan = masterRecordBook.managers.playoffs.alltime[recordManID];
		if(recordMan.length > 0) {
			alltimePlayoffWeekBests.push(recordMan.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]);
			alltimePlayoffWeekWorsts.push(recordMan.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]);
		}
	}
	alltimePlayoffWeekBests = alltimePlayoffWeekBests.sort((a, b) => b.fpts - a.fpts);
	alltimePlayoffWeekWorsts = alltimePlayoffWeekWorsts.sort((a, b) => b.fpts - a.fpts);

	for(const recordManID in masterRecordBook.managers.totals.alltime) {
		const recordMan = masterRecordBook.managers.totals.alltime[recordManID].playoffs;
		if(recordMan.length > 0) {
			alltimePlayoffBests.push(recordMan.slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 1)[0]);
			alltimePlayoffWorsts.push(recordMan.slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 1)[0]);
		}
	}
	alltimePlayoffBests = alltimePlayoffBests.sort((a, b) => b.fptspg - a.fptspg);
	alltimePlayoffWorsts = alltimePlayoffWorsts.sort((a, b) => b.fptspg - a.fptspg);


	for(const recordManID in masterRecordBook.players.managers.totals.alltime) {
		const recordMan = masterRecordBook.players.managers.totals.alltime[recordManID].playoffs;
		if(recordMan.length > 0) {
			playerATPlayoffBests.push(recordMan.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
		}
	}
	playerATPlayoffBests = playerATPlayoffBests.sort((a, b) => b.playerPoints - a.playerPoints);


	for(const recordManID in masterRecordBook.players.managers.playoffs.alltime) {
		const recordMan = masterRecordBook.players.managers.playoffs.alltime[recordManID];
		playerATPOWeekBests.push(recordMan.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]); 
		playerATPOWeekMissedBests.push(recordMan.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]); 
	}
	playerATPOWeekBests = playerATPOWeekBests.sort((a, b) => b.playerPoints - a.playerPoints);
	playerATPOWeekMissedBests = playerATPOWeekMissedBests.sort((a, b) => b.benchPoints - a.benchPoints);
	playerATPlayoffTOPS = masterRecordBook.players.league.totals.alltime.playoffs.slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	playerATPOWeekTOPS = masterRecordBook.players.league.playoffs.alltime.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10);
	playerATPOWeekMissedTOPS = masterRecordBook.players.league.playoffs.alltime.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10);

	let alltimePlayoffEPERecords = masterRecordBook.league.grandTotals.playoffs.slice().sort((a, b) => b.epePerc - a.epePerc);
	let alltimePlayoffMedianRecords = masterRecordBook.league.grandTotals.playoffs.slice().sort((a, b) => b.medianPerc - a.medianPerc);
	let alltimePlayoffCumulativePoints = masterRecordBook.league.grandTotals.playoffs.slice().sort((a, b) => b.fptspg - a.fptspg);

	allTimePOMatchupDifferentials = allTimePOMatchupDifferentials.sort((a, b) => b.differential - a.differential);
	allTimeBiggestPOBlowouts = allTimePOMatchupDifferentials.slice(0, 10);

	for(let i = 0; i < 10; i++) {
		allTimeClosestPOMatchups.push(allTimePOMatchupDifferentials.pop());
	}

	leaguePOWeekRecords = masterRecordBook.league.playoffs.alltime.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10);
	leaguePOWeekLows = masterRecordBook.league.playoffs.alltime.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10);

	const recordsData = {
		// alltimeCombinedWeekBests,
		// alltimeCombinedWeekWorsts,
		alltimeCombinedWeekLows,
		alltimeCombinedWeekRecords,
		allTimeBiggestBlowouts,
		allTimeClosestMatchups,
		allTimeWeekBests,
		allTimeWeekWorsts,
		allTimeSeasonBests,
		allTimeSeasonWorsts,
		allTimeEPERecords,
		mostSeasonLongPoints,
		leastSeasonLongPoints,
		playerATSeasonTOPS,
		playerATSeasonBests,
		playerATWeekTOPS,
		playerATWeekBests,
		playerATWeekMissedBests,
		playerATPlayoffBests,
		playerATPOWeekBests,
		playerATPOWeekMissedBests,
		playerATWeekMissedTOPS,
		playerATPOWeekMissedTOPS,
		playerATPOWeekTOPS,
		playerATPlayoffTOPS,
		leagueWeekLows,
		leagueWeekRecords,
		seasonWeekRecords,
		leagueRosterRecords,
		playoffWeekRecords,
		playoffRosterRecords,
		leaguePOWeekRecords,
		leaguePOWeekLows,
		allTimeBiggestPOBlowouts,
		allTimeClosestPOMatchups,
		currentManagers,
		currentYear,
		lastYear
	};

	// update localStorage
	localStorage.setItem("records", JSON.stringify(recordsData));

	records.update(() => recordsData);

	return recordsData;
}