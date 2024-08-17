const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class LegendOfArcadia {
    headers(authorization) {
        return {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-US,en;q=0.9",
            "Authorization": `Basic ${authorization}`,
            "Loa-Version": `1.00.56844`,
            "Origin": "https://loahero.legendofarcadia.io",
            "Priority": "u=1, i",
            "Referer": "https://loahero.legendofarcadia.io/",
            "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="126", "Microsoft Edge";v="126", "Microsoft Edge WebView2";v="126"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
        };
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }
    
    async login(queryString) {
        const url = "https://loahero.legendofarcadia.io/Mini/Login";
        const headers = {
            "Authorization": `Telegram ${queryString}`,
            "Content-Type": "application/json"
        };
        
        const payload = {
            "platform": "mini",
            "channel": "telegram",
            "data": {
                "initData": queryString,
                "initDataUnsafe": this.parseQueryString(queryString),
                "version": "7.6",
                "platform": "android",
                "colorScheme": "light",
                "themeParams": {
                    "bg_color": "#ffffff",
                    "button_color": "#3390ec",
                    "button_text_color": "#ffffff",
                    "hint_color": "#707579",
                    "link_color": "#00488f",
                    "secondary_bg_color": "#f4f4f5",
                    "text_color": "#000000",
                    "header_bg_color": "#ffffff",
                    "accent_text_color": "#3390ec",
                    "section_bg_color": "#ffffff",
                    "section_header_text_color": "#3390ec",
                    "subtitle_text_color": "#707579",
                    "destructive_text_color": "#df3f40"
                },
                "isExpanded": true,
                "viewportHeight": 639,
                "viewportStableHeight": 639,
                "isClosingConfirmationEnabled": false,
                "isVerticalSwipesEnabled": true,
                "headerColor": "#ffffff",
                "backgroundColor": "#ffffff",
                "BackButton": { "isVisible": false },
                "MainButton": {
                    "text": "CONTINUE",
                    "color": "#3390ec",
                    "textColor": "#ffffff",
                    "isVisible": false,
                    "isProgressVisible": false,
                    "isActive": true
                },
                "SettingsButton": { "isVisible": false },
                "HapticFeedback": {},
                "CloudStorage": {},
                "BiometricManager": {
                    "isInited": false,
                    "isBiometricAvailable": false,
                    "biometricType": "unknown",
                    "isAccessRequested": false,
                    "isAccessGranted": false,
                    "isBiometricTokenSaved": false,
                    "deviceId": ""
                }
            }
        };

        try {
            const response = await axios.post(url, payload, { headers });
            if (response.data.code === 0) {
                const token = response.data.data.token;
                this.log(`Đăng nhập thành công!`.green);
                return token;
            } else {
                this.log('Lỗi: Không thể đăng nhập.'.red);
            }
        } catch (error) {
            this.log('Lỗi khi gọi API đăng nhập.'.red);
            console.error(error.message.red);
        }
        return null;
    }

    parseQueryString(queryString) {
        const queryParts = queryString.split('&');
        const data = {};
        
        queryParts.forEach(part => {
            const [key, value] = part.split('=');
            data[key] = decodeURIComponent(value);
        });

        return data;
    }

    async rescueHero(authorization, heroId) {
        const url = "https://mini-01.legendofarcadia.io/Mini/RescueHero";
        const headers = this.headers(authorization);
        const payload = { HeroId: heroId };

        try {
            const response = await axios.post(url, payload, { headers });
            const heroInfo = response.data.data?.HeroInfo;
            if (heroInfo) {
                this.log(`Hồi phục HP thành công cho Hero ID: ${heroId}. HP hiện tại: ${heroInfo.Stamina.toString().white}`.green);
            } else {
                this.log(`${'Lỗi: Không thể hồi phục HP cho Hero'.red}`);
            }
        } catch (error) {
            this.log(`${'Lỗi khi gọi API cứu trợ Hero'.red}`);
            console.error(error.message.red);
        }
    }

    async heartbeat(authorization, state, attackCount) {
        const url = "https://mini-01.legendofarcadia.io/Mini/Heartbeat";
        const headers = this.headers(authorization);
        const payload = { State: state, AttackCount: attackCount };
    
        const sendRequest = async () => {
            try {
                const response = await axios.post(url, payload, { headers });
                return response.data.data?.UserBaseData;
            } catch (error) {
                this.log(`${'Lỗi khi gọi API Heartbeat'.red}`);
                console.error(error.message.red);
                return null;
            }
        };
    
        try {
            let energy = Infinity;
            while (energy > 10) {
                for (let i = 0; i < 10; i++) {
                    const result = await sendRequest();
                    if (result) {
                        let balance = result.Coin;
                        energy = result.Energy;
                        this.log(`Tap ${i + 1} | Balance: ${balance.toString().white} | Energy: ${energy.toString().white}`.green);
    
                        if (energy <= 10) {
                            this.log(`Năng lượng thấp, dừng tap.`.yellow);
                            return;
                        }
                    }
    
                    if (i < 9) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
    
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            this.log(`${'Lỗi không mong đợi trong quá trình tap'.red}`);
            console.error(error.message.red);
        }
    }

    async syncMissionAndUnlockHeroes(authorization, state) {
        const syncMissionUrl = "https://mini-02.legendofarcadia.io/Mini/SyncMissionHB";
        const heroUnlockUrl = "https://mini-02.legendofarcadia.io/Mini/HeroUnlock";
        const heroLvUpUrl = "https://mini-02.legendofarcadia.io/Mini/HeroLvUp";
        const headers = this.headers(authorization);
        const payload = { State: state, AttackCount: 0 };
    
        try {
            const response = await axios.post(syncMissionUrl, payload, { headers });

            const heroes = response.data.data?.UserData?.Hero?.Heroes;
    
            if (heroes) {
                const existingHeroIds = Object.keys(heroes).map(id => parseInt(id));
                existingHeroIds.sort((a, b) => b - a);
                const allHeroIds = Array.from({ length: 16 }, (_, i) => i + 1); 
                const unlockHeroIds = allHeroIds.filter(id => !existingHeroIds.includes(id));
    
                for (const heroId of unlockHeroIds) {
                    const unlockPayload = { HeroId: heroId };
                    try {
                        const unlockResponse = await axios.post(heroUnlockUrl, unlockPayload, { headers });
                        if (unlockResponse.data.code === 0) {
                            this.log(`Mở khóa Hero ID: ${heroId.toString().white} thành công!`.green);
                        }
                    } catch (unlockError) {
                        this.log(`Lỗi khi mở khóa Hero ID: ${heroId}.`.red);
                        console.error(unlockError.message.red);
                    }
                }
    
                for (const heroId of existingHeroIds) {
                    const lvUpPayload = { HeroId: heroId, AddLv: 10 };
                    while (true) {
                        try {
                            const lvUpResponse = await axios.post(heroLvUpUrl, lvUpPayload, { headers });
                            if (lvUpResponse.data.code === 0) {
                                this.log(`Tăng cấp Hero ID: ${heroId.toString().white} lên thêm 10 cấp!`.green);
                            } else {
                                this.log(`Lỗi khi tăng cấp Hero ID: ${heroId.toString().red}. Dừng quá trình tăng cấp.`.red);
                                break;
                            }
                        } catch (lvUpError) {
                            this.log(`Lỗi khi gọi API tăng cấp cho Hero ID: ${heroId}. Dừng quá trình tăng cấp.`.red);
                            console.error(lvUpError.message.red);
                            break;
                        }
                    }
                }
            } else {
                this.log('Không tìm thấy dữ liệu Hero.'.red);
            }
    
            if (heroes) {
                this.log('Thông tin Hero hiện có:'.green);
                for (const [heroId, heroData] of Object.entries(heroes)) {
                    this.log(`Hero ID: ${heroId}, Level: ${heroData.Level}, Stamina: ${heroData.Stamina}`.cyan);
                }
            }
    
        } catch (error) {
            this.log('Lỗi khi đồng bộ nhiệm vụ và xử lý Hero.'.red);
            console.error(error.message.red);
        }
    }

    askQuestion(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }));
    }

    async syncMission(authorization) {
        const url = "https://mini-01.legendofarcadia.io/Mini/SyncMission";
        const headers = this.headers(authorization);
    
        try {
            const response = await axios.get(url, { headers });
            const missions = response.data.data?.UserData?.Mission?.Missions;
    
            if (missions) {
                for (const missionId in missions) {
                    const mission = missions[missionId];
                    if (mission.FinTime > 0 && mission.RecvTime === 0) {
                        await this.recvMission(authorization, missionId);
                    }
                }
            } else {
                this.log('Không tìm thấy dữ liệu nhiệm vụ.'.red);
            }
        } catch (error) {
            this.log('Lỗi khi đồng bộ nhiệm vụ.'.red);
            console.error(error.message.red);
        }
    }    

    async recvMission(authorization, missionId) {
        const url = "https://mini-01.legendofarcadia.io/Mini/RecvMission";
        const headers = this.headers(authorization);
        const payload = { MissionId: missionId };

        try {
            const response = await axios.post(url, payload, { headers });
            if (response.data.code === 0) {
                this.log(`Nhận nhiệm vụ có ID ${missionId.toString().white} thành công!`.green);
            } else {
                this.log(`Không thể nhận nhiệm vụ có ID ${missionId.toString().white}.`.red);
            }
        } catch (error) {
            this.log(`Lỗi khi nhận nhiệm vụ có ID ${missionId}.`.red);
            console.error(error.message.red);
        }
    }

    async rescueFriendHero(authorization) {
        const url = "https://mini-01.legendofarcadia.io/Mini/GetFriends";
        const headers = this.headers(authorization);
        const payload = { Num: 10, LastId: "" };
        
        try {
            const response = await axios.post(url, payload, { headers });
    
            const relationInfo = response.data?.data?.RelationInfo;
    
            if (relationInfo && relationInfo.length > 0) {
                for (const friend of relationInfo) {
                    if (friend.HeroTiredNum === 1) {
                        const rescueUrl = "https://mini-01.legendofarcadia.io/Mini/RescueFriendHero";
                        const rescuePayload = { Uid: friend.Id };
                        await axios.post(rescueUrl, rescuePayload, { headers });
                        this.log(`Hồi phục hero giúp bạn bè thành công | ID : ${friend.Id}`.green);
                    }
                }
            } else {
                this.log("Không có anh hùng nào của bạn bè cần hồi phục.".yellow);
            }
        } catch (error) {
            this.log("Lỗi rồi.".red);
            console.error(error.message.red);
        }
    }

    async getWorldBossState(authorization, accountNumber, hoinangcap) {
        const url = "https://mini-02.legendofarcadia.io/Mini/GetWorldBossState";
        const headers = this.headers(authorization);
        try {
            const response = await axios.get(url, { headers });
            const userData = response.data.data?.UserBaseData;
            let bossState = response.data.data?.BossState;
            let chestState = response.data.data?.ChestState;
            const state = response.data.data?.State;
    
            if (userData) {
                console.log(`========== Tài khoản ${accountNumber} | ${userData.Name.green} ==========`);
                this.log(`Point: ${userData.Point.toString().white}`.green);
                this.log(`Minikey: ${userData.MiniKey.toString().white}`.green);
                this.log(`Coin: ${userData.Coin.toString().white}`.green);
                this.log(`Energy: ${userData.Energy.toString().white}`.green);
    
                await this.syncAndReceiveMissions(authorization);

                if (userData.MiniKey > 0) {
                    await this.openBox(authorization, userData.MiniKey);
                }
    
                const playerStates = response.data.data?.PlayerStates;
                for (const player of playerStates) {
                    if (player.CurrentHp === 0) {
                        await this.rescueHero(authorization, player.HeroId);
                    }
                }
    
                if (userData.Energy > 0) {
                    if (bossState) {
                        const attackCount = Math.floor(userData.Energy / bossState.Click2Coin);
                        if (attackCount > 0) {
                            await this.heartbeat(authorization, state, attackCount);
                        }
                    } else if (chestState) {
                        const attackCount = Math.floor(userData.Energy / chestState.Click2Coin);
                        if (attackCount > 0) {
                            await this.heartbeat(authorization, state, attackCount);
                        }
                    } else {
                        this.log(`${'Không tìm thấy dữ liệu.'.red}`);
                    }
                }

                if (hoinangcap) {
                    await this.syncMissionAndUnlockHeroes(authorization, state);
                }

                await this.rescueFriendHero(authorization);
    
            } else {
                this.log(`${'Lỗi: Không tìm thấy UserBaseData'.red}`);
            }
        } catch (error) {
            this.log(`${'Lỗi khi lấy thông tin'.red}`);
            console.error(error.message.red);
        }
    }    

    async syncAndReceiveMissions(authorization) {
        const syncUrl = "https://mini-03.legendofarcadia.io/Mini/SyncMission";
        const recvUrl = "https://mini-03.legendofarcadia.io/Mini/RecvMission";
        const headers = this.headers(authorization);
    
        try {
            const syncResponse = await axios.get(syncUrl, { headers });
            const missions = syncResponse.data.data?.UserData?.Mission?.Missions;
    
            if (missions) {
                const pendingMissions = Object.entries(missions)
                    .filter(([_, mission]) => mission.FinTime > 0 && mission.RecvTime === 0)
                    .map(([id, _]) => parseInt(id));
    
                if (pendingMissions.length > 0) {
                    this.log(`Tìm thấy ${pendingMissions.length} nhiệm vụ cần nhận thưởng.`.green);
    
                    for (const missionId of pendingMissions) {
                        const payload = { MissionId: missionId };
                        try {
                            const recvResponse = await axios.post(recvUrl, payload, { headers });
                            if (recvResponse.data.code === 0) {
                                this.log(`Đã nhận thưởng nhiệm vụ ID: ${missionId}`.green);
                            } else {
                                this.log(`Lỗi khi nhận thưởng nhiệm vụ ID: ${missionId}. Mã lỗi: ${recvResponse.data.code}`.red);
                            }
                        } catch (recvError) {
                            this.log(`Lỗi khi gọi API nhận thưởng cho nhiệm vụ ID: ${missionId}`.red);
                            console.error(recvError.message.red);
                        }
                    }
                } else {
                    this.log("Không có nhiệm vụ nào cần nhận thưởng.".yellow);
                }
            } else {
                this.log("Không tìm thấy dữ liệu nhiệm vụ.".red);
            }
        } catch (error) {
            this.log("Lỗi khi gọi API đồng bộ nhiệm vụ.".red);
            console.error(error.message.red);
        }
    }

    async openBox(authorization, minikeyCount) {
        const url = "https://mini-02.legendofarcadia.io/Mini/OpenMinicryBox";
        const headers = this.headers(authorization);
        const payload = { Num: minikeyCount };
    
        try {
            const response = await axios.post(url, payload, { headers });
            if (response.data.code === 0) {
                this.log(`Đã mở thành công ${minikeyCount} hộp Gacha Points.`.green);
            } else {
                this.log(`Lỗi khi mở hộp Gacha Points: ${response.data.message}`.red);
            }
        } catch (error) {
            this.log(`Lỗi khi gọi API mở hộp Gacha Points.`.red);
            console.error(error.message.red);
        }
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            process.stdout.write(`[*] Chờ ${i} giây để tiếp tục...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            readline.cursorTo(process.stdout, 0);
        }
        console.log('');
    }

    async main() {
        const nangcap = await this.askQuestion('Bạn có muốn mở khóa và nâng cấp hero không? (y/n): ');
        const hoinangcap = nangcap.toLowerCase() === 'y';
        while (true) {
            const dataFile = path.join(__dirname, 'data.txt');
            const lines = fs.readFileSync(dataFile, 'utf8').split('\n').filter(line => line.trim());

            for (let i = 0; i < lines.length; i++) {
                const queryString = lines[i].trim();
                if (queryString) {
                    const token = await this.login(queryString);
                    if (token) {
                        await this.getWorldBossState(token, i + 1, hoinangcap);
                        await this.waitWithCountdown(1);
                    }
                }
            }

            await this.waitWithCountdown(300);
        }
    }
}

if (require.main === module) {
    const loa = new LegendOfArcadia();
    loa.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}