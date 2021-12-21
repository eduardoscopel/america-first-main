import { managers } from '$lib/utils/leagueInfo';
import { goto } from "$app/navigation";
import { stringDate } from './news';

export const cleanName = (name) => {
    return name.replace('Team ', '').toLowerCase().replace(/[ ’'!"#$%&\\'()\*+,\-\.\/:;<=>?@\[\\\]\^_`{|}~']/g, "");
}

export const round = (num) => {
    return (Math.round((num + Number.EPSILON) * 100) / 100).toFixed(2);
}

export const min = (stats, roundOverride) => {
    const num = Math.min(...stats)
    return Math.floor(num / roundOverride) * roundOverride;
}

export const max = (stats, roundOverride) => {
    const num = Math.max(...stats)
    return Math.ceil(num / roundOverride) * roundOverride;
}

export const gotoManager = (recordManID) => {
    if(!managers.length) return;
    const managersIndex = managers.findIndex(m => m.managerID == recordManID);
    // if no manager exists for that roster, -1 will take you to the main managers page
    goto(`/managers?manager=${managersIndex}`);
}

export const getAuthor = (rosters, users, author) => {
    let user = null;
    for(const userKey of Object.keys(users)) {
        if(users[userKey].display_name.toLowerCase() == author.toLowerCase()) {
            user = users[userKey];
            break;
        }
    }
    if(!user) {
        return author;
    }
    const userID = user.user_id;
    const roster = rosters.find(r => r.owner_id == userID || (r.co_owners && r.co_owners.indexOf(userID) > -1));
    return `<a href="/managers?manager=${managers.findIndex(m => m.roster == roster.roster_id)}">${user.metadata.team_name ? user.metadata.team_name : user.display_name}</a>`;
}

export const getAvatar = (users, author) => {
    let user = null;
    let userAvatar;
    for(const userKey of Object.keys(users)) {
        if(users[userKey].display_name.toLowerCase() == author.toLowerCase()) {
            user = users[userKey];
            break;
        }
    }
    if(!user) {
        return 'managers/question.jpg';
    }

    if(user.avatar != null) {
        userAvatar = `https://sleepercdn.com/avatars/thumbs/${user.avatar}`;
    } else {
        userAvatar = `https://sleepercdn.com/images/v2/icons/player_default.webp`;
    }

    return userAvatar;
}

export const parseDate = (rawDate) => {
    const ts = Date.parse(rawDate);
    const d = new Date(ts);
    return stringDate(d);
}

export const generateGraph = ({stats, secondStats = null, x, y, stat, statCat, secondStatCat = null, header, field, short, secondField = null, classes = null}, roundOverride = 10, yMinOverride = null, classGraph = false) => {
    if(!stats) {
        return null;
    }
    const graph = {
        stats: [],
        secondStats: [],
        managers: [],
        recordManIDs: [],
        labels: {x, y, stat},
        statCat,
        secondStatCat,
        field,
        secondField,
        header,
        yMin: 0,
        yMax: 0,
        short,
        classes,
    }

    const sortedStats = [...stats].sort((a, b) => a.recordManID - b.recordManID);

    for(const indivStat of sortedStats) {
        graph.stats.push(Math.round(indivStat[field]));
        graph.managers.push(indivStat.manager);
        graph.recordManIDs.push(indivStat.recordManID)
    }

    if(secondField) {
        const sortedSecondStats = [...secondStats].sort((a, b) => a.recordManID - b.recordManID);

        for(const indivSecondStat of sortedSecondStats) {
            graph.secondStats.push(Math.round(indivSecondStat[secondField]));
        }
    }

    if(classes) {
        graph.classes = [];

        for(const statClass of classes) {
            graph.classes.push({
                keys: [],
                stats: [],
                percs: [],
                heights: [],
                short: statClass.short,
                colors: statClass.colors,
                yMax: 0,
            });

            if(!statClass.field) continue;

            const totals = {};
            const totalsArray = [];
            const statsEntry = {};
            const percsEntry = {};
            const heightsEntry = {};

            let goBetween = [];
           
            const graphClass = graph.classes.find(c => c.short == statClass.short);

            for(const key of statClass.keys) {

                if(sortedStats.find(m => m[statClass.field][key])) {

                    graphClass.keys.push(key);
                    
                    for(const indivStat of sortedStats) {

                        if(!statsEntry[indivStat.recordManID]) {
                            statsEntry[indivStat.recordManID] = [];
                        }
                        if(!percsEntry[indivStat.recordManID]) {
                            percsEntry[indivStat.recordManID] = [];
                        }

                        totalsArray.push(indivStat[statClass.totalField]);
                        totals[indivStat.recordManID] = indivStat[statClass.totalField];

                        if(indivStat[statClass.field][key]) {
                            statsEntry[indivStat.recordManID].push(Math.round(indivStat[statClass.field][key].fpts));
                            percsEntry[indivStat.recordManID].push(indivStat[statClass.field][key].perc);
                        } else {
                            statsEntry[indivStat.recordManID].push(0);
                            percsEntry[indivStat.recordManID].push(0);
                        }
                    }
                }
            }

            graphClass.yMax = Math.round(totalsArray.sort((a, b) => b - a)[0] + 0.1 * totalsArray.sort((a, b) => b - a)[0]); 
            const actualMax = totalsArray.sort((a, b) => b - a)[0];

            for(const recordManID in percsEntry) {

                heightsEntry[recordManID] = [];
                let runningHeight = 0;

                for(let i = 0; i < percsEntry[recordManID].length; i++) {
                    
                    const adjustedPerc = percsEntry[recordManID][i] * totals[recordManID] / actualMax;
                    runningHeight += adjustedPerc;
                    heightsEntry[recordManID].push(runningHeight);
                    percsEntry[recordManID][i] = Math.round(percsEntry[recordManID][i]);
                }

                goBetween.push({
                    recordManID,
                    stats: statsEntry[recordManID],
                    percs: percsEntry[recordManID],
                    heights: heightsEntry[recordManID],
                    total: totals[recordManID],
                })
            }

            goBetween = goBetween.sort((a, b) => a.recordManID - b.recordManID);
            for(const entry of goBetween) {
                graphClass.stats.push(entry.stats);
                graphClass.percs.push(entry.percs);
                graphClass.heights.push(entry.heights);
            }
            
        }
    }

    graph.yMax = max(graph.stats, roundOverride);
    graph.yMin = min(graph.stats, roundOverride);
    if(secondField) {
        graph.yMin = min(graph.secondStats, roundOverride);
    }
    if(yMinOverride) {
        graph.yMin = yMinOverride;
    }

    return graph;
}