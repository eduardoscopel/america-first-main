<script>
    import { getPlayByPlay, waitForAll } from '$lib/utils/helper'; 
    export let fantasyStarters, playersInfo, gameSelection;

    let gamePlayByPlay;

    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/situation?lang=en&region=us CURRENT DOWN
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/plays?lang=en&region=us PLAY BY PLAY
    // http://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436/competitions/401326436/competitors/22/statistics?lang=en&region=us GAME STATS
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/events/401326436?lang=en&region=us GAME
    // https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2021/types/2/weeks ALL WEEKS
    
    const loadPlayByPlay = async (gameSelection, gamePlayByPlay) => {
        const playByPlayData = await getPlayByPlay(gameSelection).catch((err) => { console.error(err); });
        gamePlayByPlay = playByPlayData;

        processPBP(gamePlayByPlay);
    }

    $: loadPlayByPlay(gameSelection, gamePlayByPlay);

    const processPBP = async (gamePlayByPlay) => {
        let recencyKey = gamePlayByPlay.length;
        const fantasyRelevantPlays = [];

        let startersArray = [];

        for(const recordManID in fantasyStarters) {
            const starters = fantasyStarters[recordManID];
            for(const starter of starters) {
                const starterInfo = playersInfo.players[starter];
                const starterEntry = {
                    playerID: starter,
                    fn: starterInfo.fn,
                    ln: starterInfo.ln,
                    pos: starterInfo.pos,
                }
                startersArray.push(starterEntry);
            }
        }

        for(let i = recencyKey; i > 0; i--) {
            let playsData = gamePlayByPlay[i - 1].items;

            for(let p = playsData.length; p > 0; p--) {
                let play = playsData[p - 1];

                let scoringPlay = new Boolean (false);
                if(play.scoreValue > 0) {
                    scoringPlay = true;
                } else {
                    scoringPlay = false;
                }
                
                let relevantPlayers = [];
                if(play.participants) {
                    for(const playerKey in play.participants) {
                        const espnPlayerLink = play.participants[playerKey].athlete.$ref;
                        const playerPromises = [];
                        playerPromises.push(fetch(`${espnPlayerLink}`, {compress: true}));
                        const playersRes = await waitForAll(...playerPromises).catch((err) => { console.error(err); });

                        const playerJsonPromises = [];
                        for(const playerRes of playersRes) {
                            const data = playerRes.json();
                            playerJsonPromises.push(data)
                            if (!playerRes.ok) {
                                throw new Error(data);
                            }
                        }
                        const espnPlayerData = await waitForAll(...playerJsonPromises).catch((err) => { console.error(err); });
                        const espnMatch = {
                            fn: espnPlayerData[0].firstName,
                            ln: espnPlayerData[0].lastName,
                            pos: espnPlayerData[0].position.abbreviation,
                        }
                        let sleeperMatch = startersArray.filter(s => s.fn == espnMatch.fn && s.ln == espnMatch.ln && s.pos == espnMatch.pos);
                        if(sleeperMatch.length > 0) {
                            relevantPlayers.push(sleeperMatch[0]);
                        }
                    }
                }
                if(relevantPlayers.length > 0) {
                    const playEntry = {
                        description: play.alternativeText,
                        scoringPlay,
                        relevantPlayers,
                    }
                    fantasyRelevantPlays.push(playEntry);
                }
            }
        }

        let test = "op";
    }
</script>

<style>
    .bigBox {
        position: relative;
        z-index: auto;
        margin: 0.5em 0;
        width: 966px;
        height: 666px;
		background-color: var(--f3f3f3);
        box-shadow: 0px 3px 3px -2px var(--boxShadowOne), 0px 3px 4px 0px var(--boxShadowTwo), 0px 1px 8px 0px var(--boxShadowThree);
    }
</style>

<div class="bigBox">{gameSelection}</div>