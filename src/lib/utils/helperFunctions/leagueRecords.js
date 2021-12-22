import { get } from 'svelte/store';
import {records} from '$lib/stores';
import { 
	loadPlayers, 
	getPreviousDrafts, 
	nflPlayerInfo, 
	nflPlayerInfo2,
	leagueID, 
	managers, 
	importHistory, 
	importType, 
	getLeagueUsers, 
	getLeagueRosters, 
	getLeagueTransactions,
	getNflState,
	getLeagueData,
	waitForAll,
	leagueHistory,
	getStarterPositions } from '$lib/utils/helper';

export const getLeagueRecords = async (refresh = false) => {
	if(get(records).seasonWeekRecords) {
		return get(records);
	}

	// // if this isn't a refresh data call, check if there are already transactions stored in localStorage
	// if(!refresh) {
	// 	let localRecords = await JSON.parse(localStorage.getItem("records"));
	// 	// check if transactions have been saved to localStorage before
	// 	if(localRecords) {
	// 		localRecords.stale = true;
	// 		return localRecords;
	// 	}
	// }

	const [playersData, previousDraftsData, nflState, transactionsData] = await waitForAll(
		loadPlayers(),
		getPreviousDrafts(),
		getNflState(),
		getLeagueTransactions(false),
	).catch((err) => { console.error(err); });

	let transactions = transactionsData.transactions;
	if(transactionsData.stale) {
		const newTransactions = await getLeagueTransactions(false, true);
		transactions = newTransactions.transactions;
	}

	let playersInfo = playersData.players;
	if(playersData.stale) {
		const newPlayersData = await loadPlayers(true);
		playersInfo = newPlayersData.players;
	}

	const draftInfo = {};
	for(const key in previousDraftsData) {
		const prevDraft = previousDraftsData[key];
		draftInfo[prevDraft.year] = prevDraft;
	}

	const transactionsInfo = {};
	for(const transaction in transactions) {
		if(!transactionsInfo[transactions[transaction].year]) {
			transactionsInfo[transactions[transaction].year] = {
				waiver: [],
				trade: [],
			}
		}
		transactionsInfo[transactions[transaction].year][transactions[transaction].type].push(transactions[transaction]);
	}

	let week = 0;
	let POrecordsWeek = 0;
	if(nflState.season_type == 'regular') {
		week = nflState.week - 1;
	} else if(nflState.season_type == 'post') {
		week = 18;
	}

	let curSeason = leagueID;

	const allManagers = {};
	
	let currentYear, lastYear;

	const leagueRosterRecords = {}; 				// every full season stat point (for each year and all years combined)
	let seasonWeekRecords = []; 				// highest weekly points within a single season

	const masterRecordBook = {
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

	const leagueManagers = {};

	const headToHeadRecords = {
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
	}

	const playerAcquisitionRecords = {
		league: {
			years: {},
			alltime: {
				regularSeason: {
					managerBests: {
						draft: {
							week_Best: [],
							period_Best: [],
						},
						trade: {
							week_Best: [],
							period_Best: [],
						},
						waiver: {
							week_Best: [],
							period_Best: [],
						},
					},
				},
				playoffs: {
					managerBests: {
						draft: {
							week_Best: [],
							period_Best: [],
						},
						trade: {
							week_Best: [],
							period_Best: [],
						},
						waiver: {
							week_Best: [],
							period_Best: [],
						},
					},
				},
				combined: {
					managerBests: {
						draft: {
							week_Best: [],
							period_Best: [],
						},
						trade: {
							week_Best: [],
							period_Best: [],
						},
						waiver: {
							week_Best: [],
							period_Best: [],
						},
					},
				},
			},
		},
		managers: {
			years: {},
			alltime: {
				regularSeason: {},
				playoffs: {},
				combined: {},
			},
		},
	};

	const playerPositionRecords = {
		league: {
			years: {},
			alltime: {
				regularSeason: {
					managerBests: {},
					leagueAverages: {},
				},
				playoffs: {
					managerBests: {},
					leagueAverages: {},
				},
				combined: {
					managerBests: {},
					leagueAverages: {},
				},
			},
		},
		managers: {
			years: {},
			alltime: {
				regularSeason: {},
				playoffs: {},
				combined: {},
			},
		},
	};
	const recordArrays = {
		league: {
			years: {},
			alltime: {
				regularSeason: {
					managerBests: {},
					players: {},
				},
				playoffs: {
					managerBests: {},
					players: {},
				},
				combined: {
					managerBests: {},
					players: {},
				},
			},
		},
		managers: {
			years: {},
			alltime: {
				regularSeason: {},
				playoffs: {},
				combined: {},
			},
		},
	};
	const acquisitionRecords = {};

	const alltimePositions = [];

	const numManagers = managers.length;
	const leagueRecordManagers = {};
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
		leagueRecordManagers[manager.managerID] = entryMan;
	}

	// SLEEPER RECORDS (MAIN)
	while(curSeason && curSeason != 0) {
		const [rosterRes, users, leagueData] = await waitForAll(
			getLeagueRosters(curSeason),
			getLeagueUsers(curSeason),
			getLeagueData(curSeason),
		).catch((err) => { console.error(err); });
	
		const year = parseInt(leagueData.season);
		const rosterSpots = getStarterPositions(leagueData);
		const positions = [];
		for(const spot of rosterSpots) {
			if(!positions.includes(spot) && spot != 'FLEX') positions.push(spot);
			if(!alltimePositions.includes(spot) && spot != 'FLEX') alltimePositions.push(spot);
		}

		for(const type in transactionsInfo[year]) {
			transactionsInfo[year][type] = transactionsInfo[year][type].reverse();
		}

		// variables for playoff records
		const numPOTeams = parseInt(leagueData.settings.playoff_teams);
		const playoffStart = parseInt(leagueData.settings.playoff_week_start);
		let playoffLength, playoffType, playoffCase;							// for later determining which playoff matchups we want to count (vs. discard)

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

			const recordManager = leagueManagers[rosterID].find(m => m.yearsactive.includes(year));
			const recordManrosterID = recordManager.rosterID;
			const recordManID = recordManager.managerID;
			
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
							acquisitionRecords[year][recordManID] = {
								draft: [],
								waiver: [],
								trade: [],
							};
						}
						acquisitionRecords[year][recordManID].draft.push({
							playerID: draftPick.playerID,
							addWeek: 0,
							dropWeek: null,
						});
					}
				}
			}

			for(const type in transactionsInfo[year]) {
	
				for(const transaction in transactionsInfo[year][type]) {

					if(transactionsInfo[year][type][transaction].moves[0][0].asset == 'player') {

						if(type == 'waiver' && transactionsInfo[year][type][transaction].recordManIDs[0] == recordManID) {

							for(const move in transactionsInfo[year][type][transaction].moves) {

								if(transactionsInfo[year][type][transaction].moves[move].find(m => m.type == 'Added')) {
									
									acquisitionRecords[year][recordManID][type].push({
										playerID: transactionsInfo[year][type][transaction].moves[move].find(m => m.type == 'Added').player,
										addWeek: transactionsInfo[year][type][transaction].week,
										dropWeek: null,
									});
								}
								if(transactionsInfo[year][type][transaction].moves[move].find(m => m.type == 'Dropped')) {

									const dropID = transactionsInfo[year][type][transaction].moves[move].find(m => m.type == 'Dropped').player;
									
									for(const transType in acquisitionRecords[year][recordManID]) {

										if(acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID) && acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID).dropWeek == null) {
											acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID).dropWeek = transactionsInfo[year][type][transaction].week;
											break;
										}
									}
								}
							}

						} else if(type == 'trade' && transactionsInfo[year][type][transaction].moves.some(m => m.find(n => n.rosterID == recordManrosterID))) {
							
							for(const move in transactionsInfo[year][type][transaction].moves) {

								if(transactionsInfo[year][type][transaction].moves[move].find(m => m.side == 'destination').rosterID == recordManrosterID) {

									acquisitionRecords[year][recordManID][type].push({
										playerID: transactionsInfo[year][type][transaction].moves[move].find(m => m.side == 'destination').player,
										addWeek: transactionsInfo[year][type][transaction].week,
										dropWeek: null,
									});
								} else if(transactionsInfo[year][type][transaction].moves[move].find(m => m.side == 'origin').rosterID == recordManrosterID) {

									const dropID = transactionsInfo[year][type][transaction].moves[move].find(m => m.side == 'origin').player;
									
									for(const transType in acquisitionRecords[year][recordManID]) {

										if(acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID) && acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID).dropWeek == null) {
											acquisitionRecords[year][recordManID][transType].find(a => a.playerID == dropID).dropWeek = transactionsInfo[year][type][transaction].week;
											break;
										}
									}
								}
							}
						}
					}
				}
			}
		}

		const originalManagers = {};
	
		for(const roster of rosters) {
			const rosterID = roster.roster_id;
			const user = users[roster.owner_id];
			
			const recordManager = leagueManagers[rosterID].find(m => m.yearsactive.includes(year));
			const recordManID = recordManager.managerID;

			if(user) {
				originalManagers[recordManID] = {
					avatar: user.avatar != null ? `https://sleepercdn.com/avatars/thumbs/${user.avatar}` : `https://sleepercdn.com/images/v2/icons/player_default.webp`,
					name: user.metadata.team_name ? user.metadata.team_name : user.display_name,
					realname: recordManager.name,
				};
			} else {
				originalManagers[recordManID] = {
					avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
					name: 'Unknown Manager',
					realname: 'John Q. Rando',
				};
			}

			if(!allManagers[recordManID]) {
				allManagers[recordManID] = originalManagers[recordManID];
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
					// regSeasonStreak: 0,
					manager: originalManagers[recordManID],
					years: [],
				}
			}
			// LONGEST STREAK UNDER CONSTRUCTION
			// const findMaximumRepeating = str => {
			// 	let max = 0;
			// 	let othermax = 0;
			// 	let maxtype = null;
			// 	let othermaxtype = null;
			// 	let streaks = {
			// 		maxarray: [],
			// 		typearray: [],
			// 	};
			// 	for(let start = 0, end = 1; end < str.length; ) {
			// 	   	if(str[end] === str[start]) {
			// 		  	if(max < end - start + 1) {
			// 				max = end - start + 1;
			// 				maxtype = str[end];
			// 		 	} else if((max === end - start + 1 || max > end - start + 1) && end - start + 1 > othermax) {
			// 				othermax = end - start + 1;
			// 			};
			// 		  	end++;
			// 	   	} else {
			// 			if(othermax === 0) {
			// 				othermax = 1;
			// 				othermaxtype = 
			// 			}
			// 			streaks.maxarray.push(max);
			// 			streaks.typearray.push(str[start]);
			// 		  	start = end;
			// 	   	};
			// 	};
			// 	return {
			// 		max,
			// 		maxtype,
			// 	}
			//  };

			// let regSeasonStreak = null;
			// const regSeasonRecord = roster.metadata.record;
			// if(typeof regSeasonRecord !== 'undefined') {
			// 	regSeasonStreak = findMaximumRepeating(regSeasonRecord);
			// }

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
				// regSeasonStreak,
				manager: originalManagers[recordManID],
				year,
				recordManID,
			}

			leagueRosterRecords[recordManID].years.push(singleYearInfo);
				
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
		masterRecordBook.players.league.totals.years[year] = {
			regularSeason: [],
			playoffs: [],
			combined: [],
		}
		masterRecordBook.players.managers.playoffs.years[year] = [];
		masterRecordBook.players.managers.regularSeason.years[year] = [];
		masterRecordBook.players.managers.combined.years[year] = [];
		masterRecordBook.players.managers.totals.years[year] = [];
		// Head to Head Objects
		headToHeadRecords.regularSeason.years[year] = {};
		headToHeadRecords.playoffs.years[year] = {};
		headToHeadRecords.combined.years[year] = {};
	
		if(startWeek > playoffStart - 1 || leagueData.status == 'complete') {
			// process all the PLAYOFFS matchups

			for(const POmatchupWeek of POmatchupsData) {
				const POmatchups = {};
				const POround = POstartWeek - POrecordsWeek;

				for(const POmatchup of POmatchupWeek) {
					const recordManID = leagueManagers[POmatchup.roster_id].find(m => m.yearsactive.includes(year)).managerID;

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

					for(const key in champMatch) {
						const opponent = champMatch[key];

						const comboEntry = {
							manager: opponent.manager,
							recordManID: opponent.recordManID,
							rosterID: opponent.rosterID,
							fpts: opponent.fpts,
							fptspg: null,
							fptsAgainst: home.fpts == away.fpts ? opponent.fpts : opponent == home ? away.fpts : home.fpts,
							againstManager: opponent.recordManID == home.recordManID ? away.manager : home.manager,
							againstRecordManID: opponent.recordManID == home.recordManID ? away.recordManID : home.recordManID,
							epeWins: 0,
							epeTies: 0,
							epeLosses: 0,
							epePerc: 0,
							weekWinner: false,
							weekLoser: false,
							weekTie: false,
							medianPerc: null,
							topScore: false,
							bottomScore: false,
							matchWin: home.fpts != away.fpts && opponent == home ? true : false,
							matchLoss: home.fpts != away.fpts && opponent == away ? true : false,
							matchTie: home.fpts == away.fpts ? true : false,
							matchDifferential: home.fpts != away.fpts && opponent == away ? (home.fpts - away.fpts) * (-1) : home.fpts - away.fpts,
							week: opponent.week,
							year,
							matchupInfo: {
								info: POmatchupWeek.find(m => m.roster_id == opponent.rosterID),
								positions: rosterSpots,
								starters: [],
							},
						}

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
						const players = opponent.players;
						const playersPTS = opponent.players_points;
						
						for(let i = 0; i < players.length; i++) {
		
							const playerID = players[i];
							const playerPoints = playersPTS[playerID];
									
							const playerEntry = {		
								recordManID: opponent.recordManID,
								manager: originalManagers[opponent.recordManID],
								week: POstartWeek,
								year,
								rosterID: opponent.rosterID,
								playerID,
								playerPoints: starters.includes(playerID) ? playerPoints : 0,
								benchPoints: !starters.includes(playerID) ? playerPoints : 0,
								weeksStarted: null,
								weeksBenched: null,
								weeksOwned: null,
								benched: starters.includes(playerID) ? false : true,
								topStarter: starters.includes(playerID) && startersPTS[0] == playerPoints ? true : false,
								bottomStarter: starters.includes(playerID) && startersPTS[startersPTS.length - 1] == playerPoints ? true : false,
								starterRank: starters.includes(playerID) ? startersPTS.indexOf(playerPoints) + 1 : null,
								numStarters: opponent.starters_points.length,
								starterRankAVG: null,
								playerInfo: playersInfo[playerID],
								nflInfo: nflPlayerInfo[playerID] ? nflPlayerInfo[playerID] : nflPlayerInfo2[playerID],
								avatar: playersInfo[playerID].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png);` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp);`,
								rosterSpot: starters.includes(playerID) ? rosterSpots[starters.indexOf(playerID)] : null,
							}

							const acquisitions = acquisitionRecords[year][opponent.recordManID];
							for(const transType in acquisitions) {
								const playerTrans = acquisitions[transType].filter(a => a.playerID == playerID);
								
								if(playerTrans?.find(t => t.addWeek <= POstartWeek && (POstartWeek <= t.dropWeek || t.dropWeek == null))) {
									playerEntry.howAcquired = transType;
								}
							}

							// add playerEntry to comboEntry
							if(playerEntry.benched == false) { 
								comboEntry.matchupInfo.starters[starters.indexOf(playerID)] = playerEntry;
							}

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

						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key];

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								fptsAgainst: home.fpts == away.fpts ? opponent.fpts : opponent == home ? away.fpts : home.fpts,
								againstManager: opponent.recordManID == home.recordManID ? away.manager : home.manager,
								againstRecordManID: opponent.recordManID == home.recordManID ? away.recordManID : home.recordManID,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: false,
								weekLoser: false,
								weekTie: false,
								medianPerc: null,
								topScore: false,
								bottomScore: false,
								matchWin: home.fpts != away.fpts && opponent == home ? true : false,
								matchLoss: home.fpts != away.fpts && opponent == away ? true : false,
								matchTie: home.fpts == away.fpts ? true : false,
								matchDifferential: home.fpts != away.fpts && opponent == away ? (home.fpts - away.fpts) * (-1) : home.fpts - away.fpts,
								week: opponent.week,
								year,
								matchupInfo: {
									info: POmatchupWeek.find(m => m.roster_id == opponent.rosterID),
									positions: rosterSpots,
									starters: [],
								},
							}
							
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
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
								const playerPoints = playersPTS[playerID];
											
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: starters.includes(playerID) ? playerPoints : 0,
									benchPoints: !starters.includes(playerID) ? playerPoints : 0,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched: starters.includes(playerID) ? false : true,
									topStarter: starters.includes(playerID) && startersPTS[0] == playerPoints ? true : false,
									bottomStarter: starters.includes(playerID) && startersPTS[startersPTS.length - 1] == playerPoints ? true : false,
									starterRank: starters.includes(playerID) ? startersPTS.indexOf(playerPoints) + 1 : null,
									numStarters: opponent.starters_points.length,
									starterRankAVG: null,
									playerInfo: playersInfo[playerID],
									nflInfo: nflPlayerInfo[playerID] ? nflPlayerInfo[playerID] : nflPlayerInfo2[playerID],
									avatar: playersInfo[playerID].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png);` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp);`,
									rosterSpot: starters.includes(playerID) ? rosterSpots[starters.indexOf(playerID)] : null,
								}
			
								const acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(const transType in acquisitions) {
									const playerTrans = acquisitions[transType].filter(a => a.playerID == playerID);
									
									if(playerTrans?.find(t => t.addWeek <= POstartWeek && (POstartWeek <= t.dropWeek || t.dropWeek == null))) {
										playerEntry.howAcquired = transType;
									}
								}

								// add playerEntry to comboEntry
								if(playerEntry.benched == false) { 
									comboEntry.matchupInfo.starters[starters.indexOf(playerID)] = playerEntry;
								}
	
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
	
						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key]

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								fptsAgainst: home.fpts == away.fpts ? opponent.fpts : opponent == home ? away.fpts : home.fpts,
								againstManager: opponent.recordManID == home.recordManID ? away.manager : home.manager,
								againstRecordManID: opponent.recordManID == home.recordManID ? away.recordManID : home.recordManID,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: false,
								weekLoser: false,
								weekTie: false,
								medianPerc: null,
								topScore: false,
								bottomScore: false,
								matchWin: home.fpts != away.fpts && opponent == home ? true : false,
								matchLoss: home.fpts != away.fpts && opponent == away ? true : false,
								matchTie: home.fpts == away.fpts ? true : false,
								matchDifferential: home.fpts != away.fpts && opponent == away ? (home.fpts - away.fpts) * (-1) : home.fpts - away.fpts,
								week: opponent.week,
								year,
								matchupInfo: {
									info: POmatchupWeek.find(m => m.roster_id == opponent.rosterID),
									positions: rosterSpots,
									starters: [],
								},
							}

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
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
								const playerPoints = playersPTS[playerID];
											
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: starters.includes(playerID) ? playerPoints : 0,
									benchPoints: !starters.includes(playerID) ? playerPoints : 0,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched: starters.includes(playerID) ? false : true,
									topStarter: starters.includes(playerID) && startersPTS[0] == playerPoints ? true : false,
									bottomStarter: starters.includes(playerID) && startersPTS[startersPTS.length - 1] == playerPoints ? true : false,
									starterRank: starters.includes(playerID) ? startersPTS.indexOf(playerPoints) + 1 : null,
									numStarters: opponent.starters_points.length,
									starterRankAVG: null,
									playerInfo: playersInfo[playerID],
									nflInfo: nflPlayerInfo[playerID] ? nflPlayerInfo[playerID] : nflPlayerInfo2[playerID],
									avatar: playersInfo[playerID].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png);` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp);`,
									rosterSpot: starters.includes(playerID) ? rosterSpots[starters.indexOf(playerID)] : null,
								}
			
								const acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(const transType in acquisitions) {
									const playerTrans = acquisitions[transType].filter(a => a.playerID == playerID);
									
									if(playerTrans?.find(t => t.addWeek <= POstartWeek && (POstartWeek <= t.dropWeek || t.dropWeek == null))) {
										playerEntry.howAcquired = transType;
									}
								}

								// add playerEntry to comboEntry
								if(playerEntry.benched == false) { 
									comboEntry.matchupInfo.starters[starters.indexOf(playerID)] = playerEntry;
								}
	
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
	
						for(const key in POmatchups[i]) {
							const opponent = POmatchups[i][key];

							const comboEntry = {
								manager: opponent.manager,
								recordManID: opponent.recordManID,
								rosterID: opponent.rosterID,
								fpts: opponent.fpts,
								fptspg: null,
								fptsAgainst: home.fpts == away.fpts ? opponent.fpts : opponent == home ? away.fpts : home.fpts,
								againstManager: opponent.recordManID == home.recordManID ? away.manager : home.manager,
								againstRecordManID: opponent.recordManID == home.recordManID ? away.recordManID : home.recordManID,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
								epePerc: 0,
								weekWinner: false,
								weekLoser: false,
								weekTie: false,
								medianPerc: null,
								topScore: false,
								bottomScore: false,
								matchWin: home.fpts != away.fpts && opponent == home ? true : false,
								matchLoss: home.fpts != away.fpts && opponent == away ? true : false,
								matchTie: home.fpts == away.fpts ? true : false,
								matchDifferential: home.fpts != away.fpts && opponent == away ? (home.fpts - away.fpts) * (-1) : home.fpts - away.fpts,
								week: opponent.week,
								year,
								matchupInfo: {
									info: POmatchupWeek.find(m => m.roster_id == opponent.rosterID),
									positions: rosterSpots,
									starters: [],
								},
							}

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
							const players = opponent.players;
							const playersPTS = opponent.players_points;
							
							for(let i = 0; i < players.length; i++) {
			
								const playerID = players[i];
								const playerPoints = playersPTS[playerID];
											
								const playerEntry = {		
									recordManID: opponent.recordManID,
									manager: originalManagers[opponent.recordManID],
									week: POstartWeek,
									year,
									rosterID: opponent.rosterID,
									playerID,
									playerPoints: starters.includes(playerID) ? playerPoints : 0,
									benchPoints: !starters.includes(playerID) ? playerPoints : 0,
									weeksStarted: null,
									weeksBenched: null,
									weeksOwned: null,
									benched: starters.includes(playerID) ? false : true,
									topStarter: starters.includes(playerID) && startersPTS[0] == playerPoints ? true : false,
									bottomStarter: starters.includes(playerID) && startersPTS[startersPTS.length - 1] == playerPoints ? true : false,
									starterRank: starters.includes(playerID) ? startersPTS.indexOf(playerPoints) + 1 : null,
									numStarters: opponent.starters_points.length,
									starterRankAVG: null,
									playerInfo: playersInfo[playerID],
									nflInfo: nflPlayerInfo[playerID] ? nflPlayerInfo[playerID] : nflPlayerInfo2[playerID],
									avatar: playersInfo[playerID].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png);` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp);`,
									rosterSpot: starters.includes(playerID) ? rosterSpots[starters.indexOf(playerID)] : null,
								}
			
								const acquisitions = acquisitionRecords[year][opponent.recordManID];
								for(const transType in acquisitions) {
									const playerTrans = acquisitions[transType].filter(a => a.playerID == playerID);
									
									if(playerTrans?.find(t => t.addWeek <= POstartWeek && (POstartWeek <= t.dropWeek || t.dropWeek == null))) {
										playerEntry.howAcquired = transType;
									}
								}

								// add playerEntry to comboEntry
								if(playerEntry.benched == false) { 
									comboEntry.matchupInfo.starters[starters.indexOf(playerID)] = playerEntry;
								}
	
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
					}
				}

				POstartWeek--;

			}
		}
		
		// process all the REGULAR SEASON matchups
		for(const matchupWeek of matchupsData) {
			const matchups = {};

			for(const matchup of matchupWeek) {

				const recordManID = leagueManagers[matchup.roster_id].find(m => m.yearsactive.includes(year)).managerID;

				const entry = {
					manager: originalManagers[recordManID],
					fpts: matchup.points,
					week: startWeek,
					year,
					rosterID: matchup.roster_id,
					epeWins: 0,
					epeTies: 0,
					epeLosses: 0,
					weekWinner: false,
					weekLoser: false,
					recordManID,
				}

				// add each entry to the matchup object
				if(!matchups[matchup.matchup_id]) {
					matchups[matchup.matchup_id] = [];
				}
				matchups[matchup.matchup_id].push(entry);

				const comboEntry = {
					manager: originalManagers[recordManID],
					recordManID,
					rosterID: matchup.roster_id,
					fpts: matchup.points,
					fptspg: null,
					fptsAgainst: null,
					againstManager: null,
					againstRecordManID: null,
					epeWins: 0,
					epeTies: 0,
					epeLosses: 0,
					epePerc: 0,
					weekWinner: false,
					weekLoser: false,
					weekTie: false,
					medianPerc: null,
					topScore: false,
					bottomScore: false,
					matchWin: false,
					matchLoss: false,
					matchTie: false,
					matchDifferential: 0,
					week: startWeek,
					year,
					matchupInfo: {
						info: matchup,
						positions: rosterSpots,
						starters: [],
					},
				}

				const starters = matchup.starters;
				const startersPTS = matchup.starters_points.sort((a, b) => b - a);
				const players = matchup.players;
				const playersPTS = matchup.players_points;
				
				for(let i = 0; i < players.length; i++) {

					const playerID = players[i];
					const playerPoints = playersPTS[playerID];

					const playerEntry = {		
						recordManID,
						manager: originalManagers[recordManID],
						week: startWeek,
						year,
						rosterID: matchup.roster_id,
						playerID,
						playerPoints: starters.includes(playerID) ? playerPoints : 0,
						benchPoints: !starters.includes(playerID) ? playerPoints : 0,
						weeksStarted: null,
						weeksBenched: null,
						weeksOwned: null,
						benched: starters.includes(playerID) ? false : true,
						topStarter: starters.includes(playerID) && startersPTS[0] == playerPoints ? true : false,
						bottomStarter: starters.includes(playerID) && startersPTS[startersPTS.length - 1] == playerPoints ? true : false,
						starterRank: starters.includes(playerID) ? startersPTS.indexOf(playerPoints) + 1 : null,
						numStarters: matchup.starters_points.length,
						starterRankAVG: null,
						playerInfo: playersInfo[playerID],
						nflInfo: nflPlayerInfo[playerID] ? nflPlayerInfo[playerID] : nflPlayerInfo2[playerID],
						avatar: playersInfo[playerID].pos == "DEF" ? `background-image: url(https://sleepercdn.com/images/team_logos/nfl/${playerID.toLowerCase()}.png);` : `background-image: url(https://sleepercdn.com/content/nfl/players/thumb/${playerID}.jpg), url(https://sleepercdn.com/images/v2/icons/player_default.webp);`,
						rosterSpot: starters.includes(playerID) ? rosterSpots[starters.indexOf(playerID)] : null,
					}

					const acquisitions = acquisitionRecords[year][recordManID];
					for(const transType in acquisitions) {
						const playerTrans = acquisitions[transType].filter(a => a.playerID == playerID);
						
						if(playerTrans?.find(t => t.addWeek <= startWeek && (startWeek <= t.dropWeek || t.dropWeek == null))) {
							playerEntry.howAcquired = transType;
						}
					}

					// add playerEntry to comboEntry if starter
					if(playerEntry.benched == false) { 
						comboEntry.matchupInfo.starters[starters.indexOf(playerID)] = playerEntry;
					}

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

				// update recordbook entries
				if(home.fpts != away.fpts) {
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchWin = true;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchLoss = true;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchDifferential = home.fpts - away.fpts;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchDifferential = away.fpts - home.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchWin = true;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchLoss = true;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchDifferential = home.fpts - away.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchDifferential = away.fpts - home.fpts;

					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchWin = true;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchLoss = true;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchDifferential = home.fpts - away.fpts;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchDifferential = away.fpts - home.fpts;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchWin = true;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchLoss = true;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchDifferential = home.fpts - away.fpts;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchDifferential = away.fpts - home.fpts;
				} else if(home.fpts == away.fpts) {
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchTie = true;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchTie = true;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.league.regularSeason.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).matchTie = true;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).matchTie = true;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.league.combined.years[year].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.league.combined.years[year].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;

					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchTie = true;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchTie = true;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.managers.regularSeason.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.managers.regularSeason.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).matchTie = true;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).matchTie = true;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).fptsAgainst = away.fpts;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).fptsAgainst = home.fpts;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstManager = away.manager;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstManager = home.manager;
					masterRecordBook.managers.combined.years[year][home.recordManID].find(p => p.week == home.week && p.recordManID == home.recordManID).againstRecordManID = away.recordManID;
					masterRecordBook.managers.combined.years[year][away.recordManID].find(p => p.week == away.week && p.recordManID == away.recordManID).againstRecordManID = home.recordManID;
				}
			}
		}
		
		for(const recordType in masterRecordBook.managers) {

			if(recordType != "totals" && recordType != "grandTotals") {

				const typeRecord = masterRecordBook.managers[recordType];

				if(!masterRecordBook.league.totals.years[year][recordType]) {
					masterRecordBook.league.totals.years[year][recordType] = [];
				}
				if(!masterRecordBook.league.totals.alltime[recordType]) {
					masterRecordBook.league.totals.alltime[recordType] = [];
				}

				for(const recordManID in allManagers) {
					if(!headToHeadRecords[recordType].alltime[recordManID]) {
						headToHeadRecords[recordType].alltime[recordManID] = {};
					}

					for(const otherManager in allManagers) {
						if(otherManager != recordManID  && !headToHeadRecords[recordType].alltime[recordManID][otherManager]) {
							headToHeadRecords[recordType].alltime[recordManID][otherManager] = {
								wins: 0,
								ties: 0,
								losses: 0,
								fpts: 0,
								fptsAgainst: 0,
								againstRecordManID: otherManager,
								againstManager: allManagers[otherManager],
								showTies: false,
								epeWins: 0,
								epeTies: 0,
								epeLosses: 0,
							}
						}
					}
				}
				
				if(typeRecord.years[year].length > 0 && Object.keys(headToHeadRecords[recordType].years[year]).length == 0) {
					for(const recordManID in typeRecord.years[year]) {

						headToHeadRecords[recordType].years[year][recordManID] = {};

						for(const otherManager in typeRecord.years[year]) {
							if(otherManager != recordManID) {
								headToHeadRecords[recordType].years[year][recordManID][otherManager] = {
									wins: 0,
									ties: 0,
									losses: 0,
									fpts: 0,
									fptsAgainst: 0,
									againstRecordManID: otherManager,
									againstManager: typeRecord.years[year][otherManager][0].manager,
									showTies: false,
									epeWins: 0,
									epeTies: 0,
									epeLosses: 0,
								}
							}
						}
					}
				}

				if(typeRecord.years[year].length > 0) {
					for(const recordManID in typeRecord.years[year]) {
						const recordMan = typeRecord.years[year][recordManID];

						const comboEntry = {
							manager: recordMan[0].manager,
							recordManID,
							rosterID: recordMan[0].rosterID,
							fpts: 0,
							fptsAgainst: 0,
							epeWins: 0,
							epeTies: 0,
							epeLosses: 0,
							weekWinners: 0,
							weekLosers: 0,
							weekTies: 0,
							topScores: 0,
							bottomScores: 0,
							wins: 0,
							losses: 0,
							ties: 0,
							periodDifferential: 0,
							week: null,
							year,
							acquisitionFpts: {},
							positionFpts: {},
						}
						// looping thru each week in that year
						for(let i = 0; i < recordMan.length; i++) {

							// add each week's score to acquisition & position totals
							for(const starter in recordMan[i].matchupInfo.starters) {

								if(!comboEntry.acquisitionFpts[recordMan[i].matchupInfo.starters[starter].howAcquired]) {
									comboEntry.acquisitionFpts[recordMan[i].matchupInfo.starters[starter].howAcquired] = {
										fpts: 0,
										weeksPlayed: 0,
									};
								}
								comboEntry.acquisitionFpts[recordMan[i].matchupInfo.starters[starter].howAcquired].fpts += recordMan[i].matchupInfo.starters[starter].playerPoints;
								comboEntry.acquisitionFpts[recordMan[i].matchupInfo.starters[starter].howAcquired].weeksPlayed++;
								
								if(!comboEntry.positionFpts[recordMan[i].matchupInfo.starters[starter].playerInfo.pos]) {
									comboEntry.positionFpts[recordMan[i].matchupInfo.starters[starter].playerInfo.pos] = {
										fpts: 0,
										weeksPlayed: 0,
									};
								}
								comboEntry.positionFpts[recordMan[i].matchupInfo.starters[starter].playerInfo.pos].fpts += recordMan[i].matchupInfo.starters[starter].playerPoints;
								comboEntry.positionFpts[recordMan[i].matchupInfo.starters[starter].playerInfo.pos].weeksPlayed++;
							}

							// add each week's score to running total & head-to-head totals
							headToHeadRecords[recordType].years[year][recordManID][recordMan[i].againstRecordManID].fpts += recordMan[i].fpts;
							headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].fpts += recordMan[i].fpts;
							headToHeadRecords[recordType].years[year][recordManID][recordMan[i].againstRecordManID].fptsAgainst += recordMan[i].fptsAgainst;
							headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].fptsAgainst += recordMan[i].fptsAgainst;

							comboEntry.fpts += recordMan[i].fpts;
							comboEntry.fptsAgainst += recordMan[i].fptsAgainst;
							comboEntry.periodDifferential += recordMan[i].matchDifferential;
							if(recordMan[i].matchWin == true) {
								comboEntry.wins++;
								headToHeadRecords[recordType].years[year][recordManID][recordMan[i].againstRecordManID].wins++;
								headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].wins++;
							} else if(recordMan[i].matchLoss == true) {
								comboEntry.losses++;
								headToHeadRecords[recordType].years[year][recordManID][recordMan[i].againstRecordManID].losses++;
								headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].losses++;
							} else if(recordMan[i].matchTie == true) {
								comboEntry.ties++;
								headToHeadRecords[recordType].years[year][recordManID][recordMan[i].againstRecordManID].ties++;
								headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].ties++;
								headToHeadRecords[recordType].alltime[recordManID][recordMan[i].againstRecordManID].showTies = true;
							}
							// compare score to other scores from that week
							const compareWins = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts < recordMan[i].fpts);
							const compareLosses = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts > recordMan[i].fpts);
							const compareTies = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week && p.fpts == recordMan[i].fpts && p.recordManID != recordMan[i].recordManID);
							// add EPE stats to running totals & head-to-head totals
							comboEntry.epeWins += compareWins.length;
							comboEntry.epeLosses += compareLosses.length;
							comboEntry.epeTies += compareTies.length;

							for(const opponent in compareWins) {
								headToHeadRecords[recordType].alltime[recordManID][compareWins[opponent].recordManID].epeWins++;
								headToHeadRecords[recordType].years[year][recordManID][compareWins[opponent].recordManID].epeWins++;
							}
							for(const opponent in compareLosses) {
								headToHeadRecords[recordType].alltime[recordManID][compareLosses[opponent].recordManID].epeLosses++;
								headToHeadRecords[recordType].years[year][recordManID][compareLosses[opponent].recordManID].epeLosses++;
							}
							for(const opponent in compareTies) {
								headToHeadRecords[recordType].alltime[recordManID][compareTies[opponent].recordManID].epeTies++;
								headToHeadRecords[recordType].years[year][recordManID][compareTies[opponent].recordManID].epeTies++;
							}
							// update that week's EPE stats in league & manager(??) records
							masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).epeWins = compareWins.length;
							masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).epeLosses = compareLosses.length;
							masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).epeTies = compareTies.length;
							masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).epePerc = (compareWins.length + compareTies.length / 2) / (compareWins.length + compareTies.length + compareLosses.length) * 100;
							// determine if top score of week AND update that week's entry in league & manager records
							if(compareLosses.length == 0) {			
								comboEntry.topScores++;
								masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).topScore = true;
							} else if(compareWins.length == 0) {
								comboEntry.bottomScores++;
								masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).bottomScore = true;
							}
							// determine if beat median score AND update that week's entry in league & manager(??) records
							let scoresArray = masterRecordBook.league[recordType].years[year].filter(p => p.week == recordMan[i].week);
							const numScores = scoresArray.length;
							scoresArray = scoresArray.sort((a, b) => b.fpts - a.fpts).slice(numScores / 2 - 1, numScores / 2 + 1);
							const medianScore = (scoresArray[0].fpts + scoresArray[1].fpts) / 2;
							if(recordMan[i].fpts > medianScore) {
								comboEntry.weekWinners++;
								masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).weekWinner = true;
							} else if(recordMan[i].fpts < medianScore) {
								comboEntry.weekLosers++;
								masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).weekLoser = true;
							} else if(recordMan[i].fpts == medianScore) {
								comboEntry.weekTies++;
								masterRecordBook.league[recordType].years[year].find(p => p.week == recordMan[i].week && p.recordManID == recordMan[i].recordManID).weekTie = true;
							}
						}

						for(const opponent in headToHeadRecords[recordType].years[year][recordManID]) {
							headToHeadRecords[recordType].years[year][recordManID][opponent].winPerc = (headToHeadRecords[recordType].years[year][recordManID][opponent].wins + headToHeadRecords[recordType].years[year][recordManID][opponent].ties / 2) / (headToHeadRecords[recordType].years[year][recordManID][opponent].wins + headToHeadRecords[recordType].years[year][recordManID][opponent].ties + headToHeadRecords[recordType].years[year][recordManID][opponent].losses) * 100;
							headToHeadRecords[recordType].years[year][recordManID][opponent].epePerc = (headToHeadRecords[recordType].years[year][recordManID][opponent].epeWins + headToHeadRecords[recordType].years[year][recordManID][opponent].epeTies / 2) / (headToHeadRecords[recordType].years[year][recordManID][opponent].epeWins + headToHeadRecords[recordType].years[year][recordManID][opponent].epeTies + headToHeadRecords[recordType].years[year][recordManID][opponent].epeLosses) * 100;
							headToHeadRecords[recordType].years[year][recordManID][opponent].fptspg = headToHeadRecords[recordType].years[year][recordManID][opponent].fpts / (headToHeadRecords[recordType].years[year][recordManID][opponent].wins + headToHeadRecords[recordType].years[year][recordManID][opponent].ties + headToHeadRecords[recordType].years[year][recordManID][opponent].losses);
							headToHeadRecords[recordType].years[year][recordManID][opponent].fptsAgainstPg = headToHeadRecords[recordType].years[year][recordManID][opponent].fptsAgainst / (headToHeadRecords[recordType].years[year][recordManID][opponent].wins + headToHeadRecords[recordType].years[year][recordManID][opponent].ties + headToHeadRecords[recordType].years[year][recordManID][opponent].losses);
						}

						comboEntry.fptspg = comboEntry.fpts / recordMan.length; 
						comboEntry.epePerc = (comboEntry.epeWins + comboEntry.epeTies / 2) / (comboEntry.epeWins + comboEntry.epeTies + comboEntry.epeLosses) * 100;
						comboEntry.medianPerc = (comboEntry.weekWinners + comboEntry.weekTies / 2) / (comboEntry.weekWinners + comboEntry.weekTies + comboEntry.weekLosers) * 100;
						comboEntry.winPerc = (comboEntry.wins + comboEntry.ties / 2) / (comboEntry.wins + comboEntry.ties + comboEntry.losses) * 100;

						for(const transType in comboEntry.acquisitionFpts) {
							comboEntry.acquisitionFpts[transType].perc = comboEntry.acquisitionFpts[transType].fpts / comboEntry.fpts * 100;
							comboEntry.acquisitionFpts[transType].fptspg = comboEntry.acquisitionFpts[transType].fpts / comboEntry.acquisitionFpts[transType].weeksPlayed;
						}

						for(const position in comboEntry.positionFpts) {
							comboEntry.positionFpts[position].perc = comboEntry.positionFpts[position].fpts / comboEntry.fpts * 100;
							comboEntry.positionFpts[position].fptspg = comboEntry.positionFpts[position].fpts / comboEntry.positionFpts[position].weeksPlayed;
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

				const typeRecordPlayer = masterRecordBook.players.managers[recordType];

				if(!masterRecordBook.players.league.totals.alltime[recordType]) {
					masterRecordBook.players.league.totals.alltime[recordType] = [];
				}

				if(typeRecordPlayer.years[year].length > 0) {
					for(const recordManID in typeRecordPlayer.years[year]) {
						const recordMan = typeRecordPlayer.years[year][recordManID];
						
						const playerTotals = {};
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
									topStarters: 0,
									bottomStarters: 0,
									starterRank: null,
									starterRankAVG: 0,
									starterRanks: 0,
									playerInfo: player.playerInfo,
									nflInfo: player.nflInfo,
									avatar: player.avatar,
									rosterSpot: player.rosterSpot,
									acquisitionInfo: {
										drafted: false,
										fpts: {},
									},
								}
								if(player.benched == false) {
									uniqueStarters++;
								}
							}

							if(player.howAcquired == 'draft' && playerTotals[player.playerID].acquisitionInfo.drafted == false) {
								playerTotals[player.playerID].acquisitionInfo.drafted = true;
							}
							
							if(playerTotals[player.playerID].rosterSpot == null || playerTotals[player.playerID].rosterSpot.includes('FLEX')) {
								playerTotals[player.playerID].rosterSpot = player.rosterSpot;
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
								if(!playerTotals[player.playerID].acquisitionInfo.fpts[player.howAcquired]) {
									playerTotals[player.playerID].acquisitionInfo.fpts[player.howAcquired] = 0;
								}
								playerTotals[player.playerID].acquisitionInfo.fpts[player.howAcquired] += player.playerPoints;
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

		// PLAYER –– POSITION - playerPositionRecords is the book of finished ARRAYS representing various positional records/rankings
		playerPositionRecords.league.years[year] = {		// Directory: for every [year]
			regularSeason: {									// League: league-wide records (ie. pooled from all managers in that year)
				managerBests: {},
				leagueAverages: {},									// regularSeason | playoffs | combined (RS & PO)
			},															// every position
			playoffs: {														// week_Top: top 10 highest-scoring performances at that position
				managerBests: {},	
				leagueAverages: {},										// period_Top: top 10 highest-scoring RS|PO|COM at that position
			},															// managerBests
			combined: {														// every position
				managerBests: {},	
				leagueAverages: {},											// week_Best: ranking every manager's highest-scoring performance at that position
			},																	// period_Best: ranking every manager's highest-scoring RS|PO|COM at that position
		};
		playerPositionRecords.managers.years[year] = {			// Managers: each manager's personal records (ie. pooled from all the players who scored for that manager in that year)
			regularSeason: {										// regularSeason | playoffs | combined (RS & PO)
				positionTotals: {},										// every position
			},																// week_Top: top 10 highest-scoring performances at that position
			playoffs: {														// period_Top: top 10 highest-scoring RS|PO|COM at that position
				positionTotals: {},										// positionTotals
			},																// every position
			combined: {															// week_Totals: ranking every week in the period by total points scored at that position
				positionTotals: {},												
			},
		};
		for(const recordPeriod in playerPositionRecords.league.years[year]) {
			for(const key in positions) {
				const position = positions[key];
				playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position] = {
					fpts: 0,
					weeksPlayed: 0,
					managerAverages: [],
				}
				playerPositionRecords.league.years[year][recordPeriod][position] = {
					week_Top: masterRecordBook.players.league[recordPeriod].years[year].slice().filter(p => p.playerInfo.pos == position && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
					period_Top: masterRecordBook.players.league.totals.years[year][recordPeriod].slice().filter(p => p.playerInfo.pos == position).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
				}
				for(const recordManID in masterRecordBook.managers.totals.years[year]) {
					if(!playerPositionRecords.managers.years[year][recordPeriod][recordManID]) {
						playerPositionRecords.managers.years[year][recordPeriod][recordManID] = {};
					}
					playerPositionRecords.managers.years[year][recordPeriod][recordManID][position] = {
						week_Top: masterRecordBook.players.league[recordPeriod].years[year].slice().filter(p => p.playerInfo.pos == position && p.benched == false && p.recordManID == recordManID).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
						period_Top: masterRecordBook.players.league.totals.years[year][recordPeriod].slice().filter(p => p.playerInfo.pos == position && p.recordManID == recordManID).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
					}
					if(!playerPositionRecords.league.years[year][recordPeriod].managerBests[position]) {
						playerPositionRecords.league.years[year][recordPeriod].managerBests[position] = {
							week_Best: [],
							period_Best: [],
						} 
					}
					playerPositionRecords.league.years[year][recordPeriod].managerBests[position].week_Best.push(playerPositionRecords.managers.years[year][recordPeriod][recordManID][position].week_Top.slice(0, 1)[0]);
					playerPositionRecords.league.years[year][recordPeriod].managerBests[position].period_Best.push(playerPositionRecords.managers.years[year][recordPeriod][recordManID][position].period_Top.slice(0, 1)[0]);

					if(masterRecordBook.managers.totals.years[year][recordManID][recordPeriod].length > 0) {
						playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].managerAverages.push({
							recordManID,
							manager: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].manager,
							fpts: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].positionFpts[position].fpts,
							fptspg: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].positionFpts[position].fptspg,
						})
						playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].fpts += masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].positionFpts[position].fpts;
						playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].weeksPlayed += masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].positionFpts[position].weeksPlayed;
					}
				}
				playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].managerAverages = playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].managerAverages.sort((a, b) => b.fptspg - a.fptspg);
				playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].fptspg = playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].fpts / playerPositionRecords.league.years[year][recordPeriod].leagueAverages[position].weeksPlayed;

				playerPositionRecords.league.years[year][recordPeriod].managerBests[position].week_Best = playerPositionRecords.league.years[year][recordPeriod].managerBests[position].week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
				playerPositionRecords.league.years[year][recordPeriod].managerBests[position].period_Best = playerPositionRecords.league.years[year][recordPeriod].managerBests[position].period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			}
		}
		playerAcquisitionRecords.managers.years[year] = {			
			regularSeason: {},
			playoffs: {},
			combined: {},
		}
		playerAcquisitionRecords.league.years[year] = {			
			regularSeason: {
				managerBests: {
					draft: {
						week_Best: [],
						period_Best: [],
					},
					trade: {
						week_Best: [],
						period_Best: [],
					},
					waiver: {
						week_Best: [],
						period_Best: [],
					},
				},
			},
			playoffs: {
				managerBests: {
					draft: {
						week_Best: [],
						period_Best: [],
					},
					trade: {
						week_Best: [],
						period_Best: [],
					},
					waiver: {
						week_Best: [],
						period_Best: [],
					},
				},
			},
			combined: {
				managerBests: {
					draft: {
						week_Best: [],
						period_Best: [],
					},
					trade: {
						week_Best: [],
						period_Best: [],
					},
					waiver: {
						week_Best: [],
						period_Best: [],
					},
				},
			},
		}
		for(const recordPeriod in playerAcquisitionRecords.managers.years[year]) {
			
			playerAcquisitionRecords.league.years[year][recordPeriod].totals = [];

			for(const transType in playerAcquisitionRecords.league.years[year][recordPeriod].managerBests) {
				playerAcquisitionRecords.league.years[year][recordPeriod][transType] = {
					week_Top: masterRecordBook.players.league[recordPeriod].years[year].slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
					period_Top: masterRecordBook.players.league.totals.years[year][recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 10),
				}
			
				for(const recordManID in masterRecordBook.managers.totals.years[year]) {
					if(masterRecordBook.managers.totals.years[year][recordManID][recordPeriod].length > 0) {

						const transPerc = masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].acquisitionFpts[transType] / masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].fpts * 100;
						if(!playerAcquisitionRecords.managers.years[year][recordPeriod][recordManID]) {
							playerAcquisitionRecords.managers.years[year][recordPeriod][recordManID] = {
								fpts: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].fpts,
								recordManID,
								manager: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].manager,
							};
						}
						playerAcquisitionRecords.managers.years[year][recordPeriod][recordManID][transType] = {
							fpts: masterRecordBook.managers.totals.years[year][recordManID][recordPeriod][0].acquisitionFpts[transType],
							perc: transPerc,
							week_Top: masterRecordBook.players.managers[recordPeriod].years[year][recordManID].slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
							period_Top: masterRecordBook.players.managers.totals.years[year][recordManID][recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 10),
						}	
						
						playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].week_Best.push(masterRecordBook.players.managers[recordPeriod].years[year][recordManID].slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
						playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].period_Best.push(masterRecordBook.players.managers.totals.years[year][recordManID][recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 1)[0]);

					}
				}
				playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].week_Best = playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
				playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].period_Best = playerAcquisitionRecords.league.years[year][recordPeriod].managerBests[transType].period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			}

			for(const recordManID in playerAcquisitionRecords.managers.years[year][recordPeriod]) {
				playerAcquisitionRecords.league.years[year][recordPeriod].totals.push(playerAcquisitionRecords.managers.years[year][recordPeriod][recordManID]);
			}
			playerAcquisitionRecords.league.years[year][recordPeriod].totals = playerAcquisitionRecords.league.years[year][recordPeriod].totals.sort((a, b) => b.fpts - a.fpts);

		}
	
		
		recordArrays.league.years[year] = {
			regularSeason: {
				managerBests: {},
				players: {},
			},
			playoffs: {
				managerBests: {},
				players: {},
			},
			combined: {
				managerBests: {},
				players: {},
			},
		};
		recordArrays.managers.years[year] = {
			regularSeason: {
				managerBests: {},
				players: {},
			},
			playoffs: {
				managerBests: {},
				players: {},
			},
			combined: {
				managerBests: {},
				players: {},
			},
		};
		for(const recordPeriod in masterRecordBook.league.totals.years[year]) {
			recordArrays.league.years[year][recordPeriod] = {
				week_Top: masterRecordBook.league[recordPeriod].years[year].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
				week_Low: masterRecordBook.league[recordPeriod].years[year].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
				period_Top: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10),
				period_Low: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10),
				biggestBlowouts: masterRecordBook.league[recordPeriod].years[year].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
				narrowestVictories: masterRecordBook.league[recordPeriod].years[year].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
			};
			recordArrays.league.years[year][recordPeriod].managerBests = {
				week_Best: [],
				week_Worst: [],
				period_Best: [],
				period_Worst: [],
				blowout_Best: [],
				blowout_Worst: [],
				narrow_Best: [],
				narrow_Worst: [],
				epeRecords: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.epePerc - a.epePerc),
				medianRecords: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.medianPerc - a.medianPerc),
				cumulativePoints: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg),
				winRecords: masterRecordBook.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.winPerc - a.winPerc),
			};
			recordArrays.league.years[year][recordPeriod].players = {
				week_Best: [],
				week_MissedBest: [],
				week_Top: masterRecordBook.players.league[recordPeriod].years[year].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
				week_MissedTop: masterRecordBook.players.league[recordPeriod].years[year].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10),
				period_Best: [],
				period_Top: masterRecordBook.players.league.totals.years[year][recordPeriod].slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),	
			};
			for(const recordManID in masterRecordBook.players.managers[recordPeriod].years[year]) {
				recordArrays.league.years[year][recordPeriod].players.week_Best.push(masterRecordBook.players.managers[recordPeriod].years[year][recordManID].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].players.week_MissedBest.push(masterRecordBook.players.managers[recordPeriod].years[year][recordManID].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].players.period_Best.push(masterRecordBook.players.managers.totals.years[year][recordManID][recordPeriod].slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].managerBests.week_Best.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]); 
				recordArrays.league.years[year][recordPeriod].managerBests.week_Worst.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]); 
				recordArrays.league.years[year][recordPeriod].managerBests.period_Best.push(masterRecordBook.managers.totals.years[year][recordManID][recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 1)[0]); 
				recordArrays.league.years[year][recordPeriod].managerBests.period_Worst.push(masterRecordBook.managers.totals.years[year][recordManID][recordPeriod].slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 1)[0]); 
				recordArrays.league.years[year][recordPeriod].managerBests.blowout_Best.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].managerBests.blowout_Worst.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].managerBests.narrow_Best.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 1)[0]);
				recordArrays.league.years[year][recordPeriod].managerBests.narrow_Worst.push(masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 1)[0]);
				if(!recordArrays.managers.years[year][recordPeriod][recordManID]) {		
					recordArrays.managers.years[year][recordPeriod][recordManID] = {
						week_Best: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
						week_Worst: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
						blowout_Best: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
						blowout_Worst: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
						narrow_Best: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
						narrow_Worst: masterRecordBook.managers[recordPeriod].years[year][recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
					};
				}
			}
			recordArrays.league.years[year][recordPeriod].players.week_Best = recordArrays.league.years[year][recordPeriod].players.week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			recordArrays.league.years[year][recordPeriod].players.week_MissedBest = recordArrays.league.years[year][recordPeriod].players.week_MissedBest.sort((a, b) => b.benchPoints - a.benchPoints);
			recordArrays.league.years[year][recordPeriod].players.period_Best = recordArrays.league.years[year][recordPeriod].players.period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			recordArrays.league.years[year][recordPeriod].managerBests.week_Best = recordArrays.league.years[year][recordPeriod].managerBests.week_Best.sort((a, b) => b.fpts - a.fpts);	
			recordArrays.league.years[year][recordPeriod].managerBests.week_Worst = recordArrays.league.years[year][recordPeriod].managerBests.week_Worst.sort((a, b) => b.fpts - a.fpts);		
			recordArrays.league.years[year][recordPeriod].managerBests.period_Best = recordArrays.league.years[year][recordPeriod].managerBests.period_Best.sort((a, b) => b.fptspg - a.fptspg);
			recordArrays.league.years[year][recordPeriod].managerBests.period_Worst = recordArrays.league.years[year][recordPeriod].managerBests.period_Worst.sort((a, b) => b.fptspg - a.fptspg);
			recordArrays.league.years[year][recordPeriod].managerBests.blowout_Best = recordArrays.league.years[year][recordPeriod].managerBests.blowout_Best.sort((a, b) => b.matchDifferential - a.matchDifferential);
			recordArrays.league.years[year][recordPeriod].managerBests.blowout_Worst = recordArrays.league.years[year][recordPeriod].managerBests.blowout_Worst.sort((a, b) => a.matchDifferential - b.matchDifferential);
			recordArrays.league.years[year][recordPeriod].managerBests.narrow_Best = recordArrays.league.years[year][recordPeriod].managerBests.narrow_Best.sort((a, b) => a.matchDifferential - b.matchDifferential);
			recordArrays.league.years[year][recordPeriod].managerBests.narrow_Worst = recordArrays.league.years[year][recordPeriod].managerBests.narrow_Worst.sort((a, b) => b.matchDifferential - a.matchDifferential);
		}

		// per-season ranks & records to push thru seasonWeekRecords
		const interSeasonEntry = {
			year,
			seasonPointsRecords: recordArrays.league.years[year].regularSeason.week_Top,
			leagueRecordArrays: recordArrays.league.years[year],
		}

		if(interSeasonEntry.seasonPointsRecords.length > 0) {
			if(!currentYear) {
				currentYear = year;
			}
			seasonWeekRecords.push(interSeasonEntry);
		};
		
	} // SEASON LOOPS HERE


	// IMPORT HISTORY
	// if(importHistory == true) {
	// 	const historyData = leagueHistory;
	// 	const weekScores = {};
	// 	const importRecords = {};

	// 	for(const key in historyData.managers) {
	// 		const recordManID = historyData.managers[key].recordManID;
	// 		importRecords[recordManID] = {
	// 			years: {},
	// 			fpts: 0,
	// 			fptsAgainst: 0,
	// 			fptspg: 0,
	// 			wins: 0,
	// 			losses: 0,
	// 			ties: 0,
	// 			winPerc: null,
	// 			epeWins: 0,
	// 			epeLosses: 0,
	// 			epeTies: 0,
	// 			epePerc: null,
	// 			topScores: 0,
	// 			bottomScores: 0,
	// 			weekWins: 0,
	// 			weekLosses: 0,
	// 			weekTies: 0,
	// 			medianPerc: null,
	// 		};

	// 		if(!allManagers[recordManID]) {
	// 			allManagers[recordManID] = {
	// 				avatar: `https://sleepercdn.com/images/v2/icons/player_default.webp`,
	// 				name: 'Placeholder',
	// 				realname: leagueRecordManagers[recordManID].name,
	// 			};
	// 		}

	// 		for(const year in historyData.managers[key].years) {
	// 			const yearTotals = historyData.managers[key].years[year]

	// 			importRecords[recordManID].fpts += yearTotals.totalFpts;
	// 			importRecords[recordManID].fptsAgainst += yearTotals.totalFptsAgainst;
	// 			importRecords[recordManID].wins += yearTotals.wins;
	// 			importRecords[recordManID].losses += yearTotals.losses;
	// 			importRecords[recordManID].ties += yearTotals.ties;

	// 			const totalPPG = yearTotals.totalFpts / (yearTotals.wins + yearTotals.losses + yearTotals.ties); 
	// 			const winPerc = (yearTotals.wins + yearTotals.ties / 2) / (yearTotals.wins + yearTotals.losses + yearTotals.ties) * 100;
	// 			const simpleEntry = {
	// 				manager: allManagers[recordManID],
	// 				recordManID: recordManID,
	// 				rosterID: leagueRecordManagers[recordManID].rosterID,
	// 				fpts: yearTotals.totalFpts,
	// 				fptspg: totalPPG,
	// 				fptsAgainst: yearTotals.totalFptsAgainst,
	// 				epeWins: 0,
	// 				epeTies: 0,
	// 				epeLosses: 0,
	// 				epePerc: null,
	// 				weekWins: 0,
	// 				weekLosses: 0,
	// 				weekTies: 0,
	// 				medianPerc: null,
	// 				topScores: 0,
	// 				bottomScores: 0,
	// 				winPerc: winPerc,
	// 				wins: yearTotals.wins,
	// 				losses: yearTotals.losses,
	// 				ties: yearTotals.ties,
	// 				periodDifferential: null,
	// 				weeks: {},
	// 				year: yearTotals.year
	// 			}

	// 			if(importType == 'complex' || importType == 'super') {
	// 				if(!weekScores[yearTotals.year]) {
	// 					weekScores[yearTotals.year] = {};
	// 				}

	// 				for(const week in yearTotals.weeks) {
	// 					const weekTotals = yearTotals.weeks[week];
	
	// 					if(!weekScores[yearTotals.year][weekTotals.week]) {
	// 						weekScores[yearTotals.year][weekTotals.week] = [];
	// 					}
	// 					weekScores[yearTotals.year][weekTotals.week].push(weekTotals.fpts)
	// 					simpleEntry.weeks[weekTotals.week] = weekTotals;
	// 				}
	// 			} 
	// 			if(importType == 'super') {
					
	// 			}

	// 			importRecords[recordManID].years[yearTotals.year] = simpleEntry;
	// 		}
	// 		importRecords[recordManID].winPerc = (importRecords[recordManID].wins + importRecords[recordManID].ties / 2) / (importRecords[recordManID].wins + importRecords[recordManID].ties + importRecords[recordManID].losses) * 100;
	// 		importRecords[recordManID].fptspg = importRecords[recordManID].fpts / (importRecords[recordManID].wins + importRecords[recordManID].ties + importRecords[recordManID].losses);
	// 	}

	// 	if(importType == 'complex' || importType == 'super') {

	// 		for(const recordManID in importRecords) {

	// 			for(const year in importRecords[recordManID].years) {

	// 				for(const week in weekScores[year]) {

	// 					const compareScore = importRecords[recordManID].years[year].weeks[week].fpts;
	// 					const epeWins = weekScores[year][week].filter(s => s < compareScore).length;
	// 					const epeLosses = weekScores[year][week].filter(s => s > compareScore).length;
	// 					const epeTies = weekScores[year][week].filter(s => s == compareScore).length - 1;

	// 					importRecords[recordManID].years[year].epeWins += epeWins;
	// 					importRecords[recordManID].years[year].epeLosses += epeLosses;
	// 					importRecords[recordManID].years[year].epeTies += epeTies;
	// 					importRecords[recordManID].epeWins += epeWins;
	// 					importRecords[recordManID].epeLosses += epeLosses;
	// 					importRecords[recordManID].epeTies += epeTies;

	// 					if(epeWins == 0) {
	// 						importRecords[recordManID].years[year].bottomScores++;
	// 						importRecords[recordManID].bottomScores++;
	// 					} else if(epeLosses == 0) {
	// 						importRecords[recordManID].years[year].topScores++;
	// 						importRecords[recordManID].topScores++;
	// 					}

	// 					const middleScores = weekScores[year][week].sort((a, b) => b - a).slice(weekScores[year][week].length / 2 - 1, weekScores[year][week].length / 2 + 1);
	// 					const medianScore = (middleScores[0] + middleScores[1]) / 2;
	// 					if(compareScore > medianScore) {
	// 						importRecords[recordManID].years[year].weekWins++;
	// 						importRecords[recordManID].weekWins++;
	// 					} else if(compareScore < medianScore) {
	// 						importRecords[recordManID].years[year].weekLosses++;
	// 						importRecords[recordManID].weekLosses++; 
	// 					} else if(compareScore == medianScore) {
	// 						importRecords[recordManID].years[year].weekTies++;
	// 						importRecords[recordManID].weekTies++;
	// 					}
	// 				}
	// 				importRecords[recordManID].years[year].epePerc = (importRecords[recordManID].years[year].epeWins + importRecords[recordManID].years[year].epeTies / 2) / (importRecords[recordManID].years[year].epeWins + importRecords[recordManID].years[year].epeTies + importRecords[recordManID].years[year].epeLosses) * 100;
	// 				importRecords[recordManID].years[year].medianPerc = (importRecords[recordManID].years[year].weekWins + importRecords[recordManID].years[year].weekTies / 2) / (importRecords[recordManID].years[year].weekWins + importRecords[recordManID].years[year].weekTies + importRecords[recordManID].years[year].weekLosses) * 100;
	// 			}
	// 			importRecords[recordManID].epePerc = (importRecords[recordManID].epeWins + importRecords[recordManID].epeTies / 2) / (importRecords[recordManID].epeWins + importRecords[recordManID].epeTies + importRecords[recordManID].epeLosses) * 100;
	// 			importRecords[recordManID].medianPerc = (importRecords[recordManID].weekWins + importRecords[recordManID].weekTies / 2) / (importRecords[recordManID].weekWins + importRecords[recordManID].weekTies + importRecords[recordManID].weekLosses) * 100;
	// 		}

	// 	} else if(importType == 'super') {

	// 	}


	// }


	
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

				for(const opponent in headToHeadRecords[recordType].alltime[recordManID]) {
					headToHeadRecords[recordType].alltime[recordManID][opponent].winPerc = (headToHeadRecords[recordType].alltime[recordManID][opponent].wins + headToHeadRecords[recordType].alltime[recordManID][opponent].ties / 2) / (headToHeadRecords[recordType].alltime[recordManID][opponent].wins + headToHeadRecords[recordType].alltime[recordManID][opponent].ties + headToHeadRecords[recordType].alltime[recordManID][opponent].losses) * 100;
					headToHeadRecords[recordType].alltime[recordManID][opponent].epePerc = (headToHeadRecords[recordType].alltime[recordManID][opponent].epeWins + headToHeadRecords[recordType].alltime[recordManID][opponent].epeTies / 2) / (headToHeadRecords[recordType].alltime[recordManID][opponent].epeWins + headToHeadRecords[recordType].alltime[recordManID][opponent].epeTies + headToHeadRecords[recordType].alltime[recordManID][opponent].epeLosses) * 100;
					headToHeadRecords[recordType].alltime[recordManID][opponent].fptspg = headToHeadRecords[recordType].alltime[recordManID][opponent].fpts / (headToHeadRecords[recordType].alltime[recordManID][opponent].wins + headToHeadRecords[recordType].alltime[recordManID][opponent].ties + headToHeadRecords[recordType].alltime[recordManID][opponent].losses);
					headToHeadRecords[recordType].alltime[recordManID][opponent].fptsAgainstPg = headToHeadRecords[recordType].alltime[recordManID][opponent].fptsAgainst / (headToHeadRecords[recordType].alltime[recordManID][opponent].wins + headToHeadRecords[recordType].alltime[recordManID][opponent].ties + headToHeadRecords[recordType].alltime[recordManID][opponent].losses);
				}
				
				const comboEntry = {
					manager: typeRecord[0].manager,
					recordManID,
					rosterID: typeRecord[0].rosterID,
					fpts: 0,
					fptsAgainst: 0,
					epeWins: 0,
					epeTies: 0,
					epeLosses: 0,
					weekWinners: 0,
					weekLosers: 0,
					weekTies: 0,
					wins: 0,
					ties: 0,
					losses: 0,
					topScores: 0,
					bottomScores: 0,
					acquisitionFpts: {},
					positionFpts: {},
				}
				
				// looping thru totals from each regSeason, playoff, & combined regSeason+playoff period
				for(let i = 0; i < typeRecord.length; i++) {
					comboEntry.fpts += typeRecord[i].fpts;
					comboEntry.fptsAgainst += typeRecord[i].fptsAgainst;
					comboEntry.wins += typeRecord[i].wins;
					comboEntry.ties += typeRecord[i].ties;
					comboEntry.losses += typeRecord[i].losses;
					comboEntry.epeWins += typeRecord[i].epeWins;
					comboEntry.epeTies += typeRecord[i].epeTies;
					comboEntry.epeLosses += typeRecord[i].epeLosses;
					comboEntry.weekWinners += typeRecord[i].weekWinners;
					comboEntry.weekLosers += typeRecord[i].weekLosers;
					comboEntry.weekTies += typeRecord[i].weekTies;
					comboEntry.topScores += typeRecord[i].topScores;
					comboEntry.bottomScores += typeRecord[i].bottomScores;

					// add each period's score to acquisition & position totals
					for(const transType in typeRecord[i].acquisitionFpts) {

						if(!comboEntry.acquisitionFpts[transType]) {
							comboEntry.acquisitionFpts[transType] = {
								fpts: 0,
								weeksPlayed: 0,
							};
						}
						comboEntry.acquisitionFpts[transType].fpts += typeRecord[i].acquisitionFpts[transType].fpts;
						comboEntry.acquisitionFpts[transType].weeksPlayed += typeRecord[i].acquisitionFpts[transType].weeksPlayed;
					}
					for(const position in typeRecord[i].positionFpts) {

						if(!comboEntry.positionFpts[position]) {
							comboEntry.positionFpts[position] = {
								fpts: 0,
								weeksPlayed: 0,
							};
						}
						comboEntry.positionFpts[position].fpts += typeRecord[i].positionFpts[position].fpts;
						comboEntry.positionFpts[position].weeksPlayed += typeRecord[i].positionFpts[position].weeksPlayed;
					}
				}
				// determine percentage-of-total stats
				comboEntry.fptspg = comboEntry.fpts / (comboEntry.weekWinners + comboEntry.weekTies + comboEntry.weekLosers);  		// denominator is equal to # of games played for this record type
				comboEntry.epePerc = (comboEntry.epeWins + comboEntry.epeTies / 2) / (comboEntry.epeWins + comboEntry.epeTies + comboEntry.epeLosses) * 100;
				comboEntry.medianPerc = (comboEntry.weekWinners + comboEntry.weekTies / 2) / (comboEntry.weekWinners + comboEntry.weekTies + comboEntry.weekLosers) * 100;
				comboEntry.winPerc = (comboEntry.wins + comboEntry.ties / 2) / (comboEntry.wins + comboEntry.ties + comboEntry.losses) * 100;

				for(const transType in comboEntry.acquisitionFpts) {
					comboEntry.acquisitionFpts[transType].perc = comboEntry.acquisitionFpts[transType].fpts / comboEntry.fpts * 100;
					comboEntry.acquisitionFpts[transType].fptspg = comboEntry.acquisitionFpts[transType].fpts / comboEntry.acquisitionFpts[transType].weeksPlayed;
				}
				for(const position in comboEntry.positionFpts) {
					comboEntry.positionFpts[position].perc = comboEntry.positionFpts[position].fpts / comboEntry.fpts * 100;
					comboEntry.positionFpts[position].fptspg = comboEntry.positionFpts[position].fpts / comboEntry.positionFpts[position].weeksPlayed;
				}

				// push to masterRecordBook
				masterRecordBook.managers.grandTotals[recordManID][recordType].push(comboEntry);
				masterRecordBook.league.grandTotals[recordType].push(comboEntry);
			}
		}
		const recordManPlayer = masterRecordBook.players.managers.totals.alltime[recordManID];

		for(const recordType in recordManPlayer) {
			const typeRecord = recordManPlayer[recordType];

			if(!masterRecordBook.players.managers.grandTotals[recordType][recordManID]) {
				masterRecordBook.players.managers.grandTotals[recordType][recordManID] = [];
			}

			if(typeRecord.length > 0) {

				for(const key in typeRecord) {
					const player = typeRecord[key];
				
					if(!masterRecordBook.players.managers.grandTotals[recordType][recordManID].find(p => p.playerID == player.playerID)) {
						masterRecordBook.players.managers.grandTotals[recordType][recordManID].push({
							recordManID,
							manager: player.manager,
							rosterID: player.rosterID,
							playerID: player.playerID,
							playerPoints: 0,
							playerPPStart: 0,
							benchPoints: 0,
							weeksStarted: 0,
							weeksBenched: 0,
							weeksOwned: 0,
							years: [],
							yearsOwned: 0,
							topStarters: 0,
							bottomStarters: 0,
							starterRanks: 0,
							starterRankAVG: 0,
							numStarters: 0,
							playerInfo: player.playerInfo,
							nflInfo: player.nflInfo,
							avatar: player.avatar,
							rosterSpot: player.rosterSpot,
							acquisitionInfo: {
								timesDrafted: 0,
								fpts: {},
							},
						})
					}

					const playerRecord = masterRecordBook.players.managers.grandTotals[recordType][recordManID].find(p => p.playerID == player.playerID);

					if(playerRecord.rosterSpot == null || playerRecord.rosterSpot.includes('FLEX')) {
						playerRecord.rosterSpot = player.rosterSpot;
					}

					if(player.acquisitionInfo.drafted == true) {
						playerRecord.acquisitionInfo.timesDrafted++;
					}

					if(!playerRecord.years.includes(player.year)) {
						playerRecord.years.push(player.year);
						playerRecord.yearsOwned++;
					}

					playerRecord.weeksOwned += player.weeksOwned;
					playerRecord.weeksStarted += player.weeksStarted;
					playerRecord.weeksBenched += player.weeksBenched;
					playerRecord.benchPoints += player.benchPoints;
					playerRecord.playerPoints += player.playerPoints;
					playerRecord.starterRanks += player.starterRanks;
					playerRecord.numStarters += player.numStarters;
					playerRecord.topStarters += player.topStarters;
					playerRecord.bottomStarters += player.bottomStarters;
					
					for(const type in player.acquisitionInfo.fpts) {

						if(!playerRecord.acquisitionInfo.fpts[type]) {
							playerRecord.acquisitionInfo.fpts[type] = player.acquisitionInfo.fpts[type];
						} else {
							playerRecord.acquisitionInfo.fpts[type] += player.acquisitionInfo.fpts[type];
						}
					}
				}

				for(const playerKey in masterRecordBook.players.managers.grandTotals[recordType][recordManID]) {
					const player = masterRecordBook.players.managers.grandTotals[recordType][recordManID][playerKey];
				
					if(player.weeksStarted > 0) {
						player.playerPPStart = player.playerPoints / player.weeksStarted;
						player.starterRankAVG = player.starterRanks / player.weeksStarted;
					} 
				}
			}
		}
	}

	// PLAYER –– POSITION –– ALLTIME - playerPositionRecords is the book of finished ARRAYS representing various positional records/rankings
	for(const recordPeriod in playerPositionRecords.league.alltime) {
		for(const key in alltimePositions) {
			const position = alltimePositions[key];

			playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position] = {
				fpts: 0,
				weeksPlayed: 0,
				managerAverages: [],
			}
			playerPositionRecords.league.alltime[recordPeriod][position] = {
				week_Top: masterRecordBook.players.league[recordPeriod].alltime.slice().filter(p => p.playerInfo.pos == position && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
				period_Top: masterRecordBook.players.league.totals.alltime[recordPeriod].slice().filter(p => p.playerInfo.pos == position).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			}
			for(const recordManID in masterRecordBook.managers.totals.alltime) {
				if(!playerPositionRecords.managers.alltime[recordPeriod][recordManID]) {
					playerPositionRecords.managers.alltime[recordPeriod][recordManID] = {};
				}
				playerPositionRecords.managers.alltime[recordPeriod][recordManID][position] = {
					week_Top: masterRecordBook.players.league[recordPeriod].alltime.slice().filter(p => p.playerInfo.pos == position && p.benched == false && p.recordManID == recordManID).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
					period_Top: masterRecordBook.players.league.totals.alltime[recordPeriod].slice().filter(p => p.playerInfo.pos == position && p.recordManID == recordManID).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
				}
				if(!playerPositionRecords.league.alltime[recordPeriod].managerBests[position]) {
					playerPositionRecords.league.alltime[recordPeriod].managerBests[position] = {
						week_Best: [],
						period_Best: [],
					} 
				}
				playerPositionRecords.league.alltime[recordPeriod].managerBests[position].week_Best.push(playerPositionRecords.managers.alltime[recordPeriod][recordManID][position].week_Top.slice(0, 1)[0]);
				playerPositionRecords.league.alltime[recordPeriod].managerBests[position].period_Best.push(playerPositionRecords.managers.alltime[recordPeriod][recordManID][position].period_Top.slice(0, 1)[0]);

				if(masterRecordBook.managers.grandTotals[recordManID][recordPeriod].length > 0) {
					playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].managerAverages.push({
						recordManID,
						manager: masterRecordBook.managers.grandTotals[recordManID][recordPeriod][0].manager,
						fpts: masterRecordBook.managers.grandTotals[recordManID][recordPeriod][0].positionFpts[position].fpts,
						fptspg: masterRecordBook.managers.grandTotals[recordManID][recordPeriod][0].positionFpts[position].fptspg,
					})
					playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].fpts += masterRecordBook.managers.grandTotals[recordManID][recordPeriod][0].positionFpts[position].fpts;
					playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].weeksPlayed += masterRecordBook.managers.grandTotals[recordManID][recordPeriod][0].positionFpts[position].weeksPlayed;
					
				}
			}
			playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].managerAverages = playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].managerAverages.sort((a, b) => b.fptspg - a.fptspg);
			playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].fptspg = playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].fpts / playerPositionRecords.league.alltime[recordPeriod].leagueAverages[position].weeksPlayed;

			playerPositionRecords.league.alltime[recordPeriod].managerBests[position].week_Best = playerPositionRecords.league.alltime[recordPeriod].managerBests[position].week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			playerPositionRecords.league.alltime[recordPeriod].managerBests[position].period_Best = playerPositionRecords.league.alltime[recordPeriod].managerBests[position].period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
		}
	}

	// PLAYER - ACQUISITION - ALLTIME

	for(const recordPeriod in playerAcquisitionRecords.league.alltime) {
			
		playerAcquisitionRecords.league.alltime[recordPeriod].totals = [];

		for(const transType in playerAcquisitionRecords.league.alltime[recordPeriod].managerBests) {
			playerAcquisitionRecords.league.alltime[recordPeriod][transType] = {
				week_Top: masterRecordBook.players.league[recordPeriod].alltime.slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
				period_Top: masterRecordBook.players.league.totals.alltime[recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 10),
			}
		
			for(const recordManID in masterRecordBook.managers.totals.alltime) {
				if(masterRecordBook.managers.totals.alltime[recordManID][recordPeriod].length > 0) {

					for(const season in masterRecordBook.managers.totals.alltime[recordManID][recordPeriod]) {

						const transPerc = masterRecordBook.managers.totals.alltime[recordManID][recordPeriod][season].acquisitionFpts[transType] / masterRecordBook.managers.totals.alltime[recordManID][recordPeriod][season].fpts * 100;
						if(!playerAcquisitionRecords.managers.alltime[recordPeriod][recordManID]) {
							playerAcquisitionRecords.managers.alltime[recordPeriod][recordManID] = {
								fpts: masterRecordBook.managers.totals.alltime[recordManID][recordPeriod][season].fpts,
								recordManID,
								manager: masterRecordBook.managers.totals.alltime[recordManID][recordPeriod][season].manager,
							};
						}
						playerAcquisitionRecords.managers.alltime[recordPeriod][recordManID][transType] = {
							fpts: masterRecordBook.managers.totals.alltime[recordManID][recordPeriod][season].acquisitionFpts[transType],
							perc: transPerc,
							week_Top: masterRecordBook.players.managers[recordPeriod].alltime[recordManID].slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
							period_Top: masterRecordBook.players.managers.totals.alltime[recordManID][recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 10),
						}	
						
						playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].week_Best.push(masterRecordBook.players.managers[recordPeriod].alltime[recordManID].slice().filter(p => p.howAcquired == transType && p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
						playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].period_Best.push(masterRecordBook.players.managers.totals.alltime[recordManID][recordPeriod].slice().filter(p => p.acquisitionInfo.fpts[transType]).sort((a, b) => b.acquisitionInfo.fpts[transType] - a.acquisitionInfo.fpts[transType]).slice(0, 1)[0]);
					}
				}
			}
			playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].week_Best = playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
			playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].period_Best = playerAcquisitionRecords.league.alltime[recordPeriod].managerBests[transType].period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
		}

		for(const recordManID in playerAcquisitionRecords.managers.alltime[recordPeriod]) {
			playerAcquisitionRecords.league.alltime[recordPeriod].totals.push(playerAcquisitionRecords.managers.alltime[recordPeriod][recordManID]);
		}
		playerAcquisitionRecords.league.alltime[recordPeriod].totals = playerAcquisitionRecords.league.alltime[recordPeriod].totals.sort((a, b) => b.fpts - a.fpts);

	}

	for(const recordPeriod in masterRecordBook.league.totals.alltime) {
		recordArrays.league.alltime[recordPeriod] = {
			week_Top: masterRecordBook.league[recordPeriod].alltime.slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
			week_Low: masterRecordBook.league[recordPeriod].alltime.slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
			period_Top: masterRecordBook.league.totals.alltime[recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10),
			period_Low: masterRecordBook.league.totals.alltime[recordPeriod].slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10),
			biggestBlowouts: masterRecordBook.league[recordPeriod].alltime.slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
			narrowestVictories: masterRecordBook.league[recordPeriod].alltime.slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
		};
		recordArrays.league.alltime[recordPeriod].managerBests = {
			week_Best: [],
			week_Worst: [],
			period_Best: [],
			period_Worst: [],
			blowout_Best: [],
			blowout_Worst: [],
			narrow_Best: [],
			narrow_Worst: [],
			epeRecords: masterRecordBook.league.grandTotals[recordPeriod].slice().sort((a, b) => b.epePerc - a.epePerc),
			medianRecords: masterRecordBook.league.grandTotals[recordPeriod].slice().sort((a, b) => b.medianPerc - a.medianPerc),
			cumulativePoints: masterRecordBook.league.grandTotals[recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg),
			winRecords: masterRecordBook.league.grandTotals[recordPeriod].slice().sort((a, b) => b.winPerc - a.winPerc),
		};
		recordArrays.league.alltime[recordPeriod].players = {
			week_Best: [],
			week_MissedBest: [],
			week_Top: masterRecordBook.players.league[recordPeriod].alltime.slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),
			week_MissedTop: masterRecordBook.players.league[recordPeriod].alltime.slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 10),
			period_Best: [],
			period_Top: masterRecordBook.players.league.totals.alltime[recordPeriod].slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 10),	
		};
		for(const recordManID in masterRecordBook.players.managers[recordPeriod].alltime) {
			recordArrays.league.alltime[recordPeriod].players.week_Best.push(masterRecordBook.players.managers[recordPeriod].alltime[recordManID].slice().filter(p => p.benched == false).sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].players.week_MissedBest.push(masterRecordBook.players.managers[recordPeriod].alltime[recordManID].slice().filter(p => p.benched == true).sort((a, b) => b.benchPoints - a.benchPoints).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].players.period_Best.push(masterRecordBook.players.managers.totals.alltime[recordManID][recordPeriod].slice().sort((a, b) => b.playerPoints - a.playerPoints).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].managerBests.week_Best.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 1)[0]); 
			recordArrays.league.alltime[recordPeriod].managerBests.week_Worst.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 1)[0]); 
			recordArrays.league.alltime[recordPeriod].managerBests.period_Best.push(masterRecordBook.managers.totals.alltime[recordManID][recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 1)[0]); 
			recordArrays.league.alltime[recordPeriod].managerBests.period_Worst.push(masterRecordBook.managers.totals.alltime[recordManID][recordPeriod].slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 1)[0]); 
			recordArrays.league.alltime[recordPeriod].managerBests.blowout_Best.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].managerBests.blowout_Worst.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].managerBests.narrow_Best.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 1)[0]);
			recordArrays.league.alltime[recordPeriod].managerBests.narrow_Worst.push(masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 1)[0]);
			if(!recordArrays.managers.alltime[recordPeriod][recordManID]) {		
				recordArrays.managers.alltime[recordPeriod][recordManID] = {
					week_Best: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().sort((a, b) => b.fpts - a.fpts).slice(0, 10),
					week_Worst: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().sort((a, b) => a.fpts - b.fpts).slice(0, 10),
					period_Best: masterRecordBook.managers.totals.alltime[recordManID][recordPeriod].slice().sort((a, b) => b.fptspg - a.fptspg).slice(0, 10),
					period_Worst: masterRecordBook.managers.totals.alltime[recordManID][recordPeriod].slice().sort((a, b) => a.fptspg - b.fptspg).slice(0, 10),
					blowout_Best: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
					blowout_Worst: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
					narrow_Best: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential >= 0).sort((a, b) => a.matchDifferential - b.matchDifferential).slice(0, 10),
					narrow_Worst: masterRecordBook.managers[recordPeriod].alltime[recordManID].slice().filter(v => v.matchDifferential <= 0).sort((a, b) => b.matchDifferential - a.matchDifferential).slice(0, 10),
				};
			}
		}
		recordArrays.league.alltime[recordPeriod].players.week_Best = recordArrays.league.alltime[recordPeriod].players.week_Best.sort((a, b) => b.playerPoints - a.playerPoints);
		recordArrays.league.alltime[recordPeriod].players.week_MissedBest = recordArrays.league.alltime[recordPeriod].players.week_MissedBest.sort((a, b) => b.benchPoints - a.benchPoints);
		recordArrays.league.alltime[recordPeriod].players.period_Best = recordArrays.league.alltime[recordPeriod].players.period_Best.sort((a, b) => b.playerPoints - a.playerPoints);
		recordArrays.league.alltime[recordPeriod].managerBests.week_Best = recordArrays.league.alltime[recordPeriod].managerBests.week_Best.sort((a, b) => b.fpts - a.fpts);	
		recordArrays.league.alltime[recordPeriod].managerBests.week_Worst = recordArrays.league.alltime[recordPeriod].managerBests.week_Worst.sort((a, b) => b.fpts - a.fpts);		
		recordArrays.league.alltime[recordPeriod].managerBests.period_Best = recordArrays.league.alltime[recordPeriod].managerBests.period_Best.sort((a, b) => b.fptspg - a.fptspg);
		recordArrays.league.alltime[recordPeriod].managerBests.period_Worst = recordArrays.league.alltime[recordPeriod].managerBests.period_Worst.sort((a, b) => b.fptspg - a.fptspg);
		recordArrays.league.alltime[recordPeriod].managerBests.blowout_Best = recordArrays.league.alltime[recordPeriod].managerBests.blowout_Best.sort((a, b) => b.matchDifferential - a.matchDifferential);
		recordArrays.league.alltime[recordPeriod].managerBests.blowout_Worst = recordArrays.league.alltime[recordPeriod].managerBests.blowout_Worst.sort((a, b) => a.matchDifferential - b.matchDifferential);
		recordArrays.league.alltime[recordPeriod].managerBests.narrow_Best = recordArrays.league.alltime[recordPeriod].managerBests.narrow_Best.sort((a, b) => a.matchDifferential - b.matchDifferential);
		recordArrays.league.alltime[recordPeriod].managerBests.narrow_Worst = recordArrays.league.alltime[recordPeriod].managerBests.narrow_Worst.sort((a, b) => b.matchDifferential - a.matchDifferential);
	}

	const recordsData = {
		seasonWeekRecords,
		leagueRosterRecords,
		playerPositionRecords,
		leagueWeekRecords: recordArrays.league.alltime.regularSeason.week_Top,
		leagueRecordArrays: recordArrays.league.alltime,
		playerAcquisitionRecords,
		allManagers,
		currentYear,
		lastYear,
	};

	// const storedData = {
	// 	seasonWeekRecords,
	// 	leagueRosterRecords,
	// 	leagueWeekRecords: recordArrays.league.alltime.regularSeason.week_Top,
	// 	allManagers,
	// 	currentYear,
	// 	lastYear,
	// };

	// update localStorage
	// localStorage.setItem("records", JSON.stringify(storedData));

	records.update(() => recordsData);

	return recordsData;
}