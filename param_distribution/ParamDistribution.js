/*:
 * MIT License
 *
 * Copyright (c) 2024 KimythAnly
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * @target MZ @plugindesc Actor params distribution. @author KimythAnly
 *
 * @help ParamDistribution.js
 *
 * This plugin for RPG Maker MZ allows developers to implement a custom
 * parameter (stats) distribution system for actors. Players can allocate points
 * to their characters' parameters (such as MaxHP, MaxMP, Attack, Defense, etc.)
 * according to their preference, enhancing the customization and strategy
 * elements of the game.
 *
 * Features:
 * - Customizable maximum values for each parameter to ensure balanced gameplay.
 * - Flexible cost and gain settings for each step of parameter increase,
 *   allowing for fine-tuning of the distribution system.
 * - Integration with the game's existing menu system for a seamless user
 *   experience.
 * - Visual representation of parameter distribution through a polygon graph,
 *   providing an intuitive overview of a character's strengths and weaknesses.
 *
 * Plugin Commands:
 * - Operate Param Points: Adjust the player's available points for parameter
 *   distribution. Supports addition, subtraction, and assignment operations.
 *
 * Usage:
 * - Configure the plugin parameters through the RPG Maker MZ editor to set the
 *   maximum values, cost per step, and gain per step for each parameter.
 * - Use the provided plugin command to modify the player's available points for
 *   distribution.
 * - Access the parameter distribution menu through the game's menu system to
 *   allocate points to the desired parameters.
 *
 * @param Text
 *
 * @param textParamDistribution
 * @text Param distribution
 * @parent Text
 * @default能力分配
 *
 * @param textParamPoints
 * @text Param points
 * @parent Text
 * @default 剩餘點數
 *
 * @param textOk
 * @text Done
 * @parent Text
 * @default 確認
 *
 * @param textReset
 * @text Reset
 * @parent Text
 * @default 重置
 *
 * @param textParamHelp
 * @text Help text for each param.
 * @parent Text
 * @default 消秏 %cost 點能力點數，提升 %value 點 %param。
 *
 * @param maxParams
 * @type number[]
 * @desc Set the maximum for each params.The order is Mhp, Mmp, Atk, Def, Mat,
 * Mdf, Agi, and Luk.
 * @default [9999, 9999, 999, 999, 999, 999, 999, 999]
 *
 * @param gainPerStep
 * @type number[]
 * @desc Set the param gain each time. The order is Mhp, Mmp, Atk, Def, Mat,
 * Mdf, Agi, and Luk.
 * @default [10, 10, 1, 1, 1, 1, 1, 1]
 *
 * @param costPerStep
 * @type number[]
 * @desc Set the points cost each time. The order is Mhp, Mmp, Atk, Def, Mat,
 * Mdf, Agi, and Luk.
 * @default [1, 1, 1, 1, 1, 1, 1, 1]
 *
 * @param gainPerLevel
 * @type number
 * @desc Set the points gain when level up.
 * @default 10
 *
 * @command operateParamPoints
 * @text Operate param points
 * @desc Operate param points.
 *
 * @arg actor
 * @text Actor
 * @desc The target actor.
 * @type actor
 *
 * @arg operation
 * @text Operation
 * @desc The operation to be performed.
 * @type select
 * @default Add
 * @option Add
 * @option Substract
 * @option Assign
 *
 * @arg points
 * @text Points
 * @desc A number specifying the operand.
 * @type number
 * @default 0
 */

(() => {
    // Plugin parameters.
    const pluginName = document.currentScript.src.match(/^.*\/(.*).js$/)[1];
    const parameter = PluginManager.parameters(pluginName);
    const textOk = parameter['textOk'];
    const textReset = parameter['textReset'];
    const textParamDistribution = parameter['textParamDistribution'];
    const textParamPoints = parameter['textParamPoints'];
    const textParamHelp = parameter['textParamHelp'];
    const maxParams = JSON.parse(parameter['maxParams']).map((str) =>
        parseInt(str)
    );
    const gainPerStep = JSON.parse(parameter['gainPerStep']).map((str) =>
        parseInt(str)
    );
    const costPerStep = JSON.parse(parameter['costPerStep']).map((str) =>
        parseInt(str)
    );
    const gainPerLevel = Number(parameter['gainPerLevel']);

    PluginManager.registerCommand(
        'ParamDistribution',
        'operateParamPoints',
        (args) => {
            const actor = $gameActors.actor(args.actor);
            const points = parseInt(args.points);
            const operation = args.operation;
            switch (operation) {
                case 'Add':
                    actor.gainParamPoints(points);
                    break;
                case 'Substract':
                    actor.loseParamPoints(points);
                    break;
                case 'Set':
                    actor.setParamPoints(points);
                    break;
            }
        }
    );

    //--------------------------------------------------------------------------
    // Bitmap

    Bitmap.prototype.drawLine = function (
        startPoint,
        endPoint,
        lineWidth,
        color
    ) {
        const ctx = this.context;

        ctx.save();
        ctx.lineWidth = lineWidth || ctx.lineWidth;
        ctx.strokeStyle = color || ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(startPoint[0], startPoint[1]);
        ctx.lineTo(endPoint[0], endPoint[1]);
        ctx.stroke();
        ctx.restore();
        this._baseTexture.update();
    };

    Bitmap.prototype.strokePath = function (points, lineWidth, color) {
        const ctx = this.context;

        ctx.save();
        ctx.lineWidth = lineWidth || ctx.lineWidth;
        ctx.strokeStyle = color || ctx.strokeStyle;
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i == 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
        this._baseTexture.update();
    };

    Bitmap.prototype.fillPath = function (points, style) {
        const ctx = this.context;

        ctx.save();
        ctx.fillStyle = style || ctx.fillStyle;
        ctx.beginPath();
        points.forEach((point, i) => {
            if (i == 0) ctx.moveTo(point[0], point[1]);
            else ctx.lineTo(point[0], point[1]);
        });
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        this._baseTexture.update();
    };

    Bitmap.prototype.strokePolygon = function (
        sides,
        centerX,
        centerY,
        radius,
        lineWidth,
        color
    ) {
        let points = [];
        for (let i = 0; i < sides; i++) {
            const x =
                centerX +
                radius * Math.cos((2 * Math.PI * i) / sides - Math.PI / 2);
            const y =
                centerY +
                radius * Math.sin((2 * Math.PI * i) / sides - Math.PI / 2);
            points.push([x, y]);
        }
        this.strokePath(points, lineWidth, color);
    };

    //--------------------------------------------------------------------------
    // Game_Actor

    const _Game_Actor_initialize = Game_Actor.prototype.initMembers;
    Game_Actor.prototype.initMembers = function () {
        _Game_Actor_initialize.apply(this, arguments);
        this._paramPoints = 0;
        this._distributedParams = new Array(8).fill(0);
    };

    Game_Actor.prototype.paramPoints = function () {
        return this._paramPoints;
    };

    Game_Actor.prototype.gainParamPoints = function (amount) {
        this._paramPoints += amount;
    };

    Game_Actor.prototype.loseParamPoints = function (amount) {
        this.gainParamPoints(-amount);
    };

    Game_Actor.prototype.setParamPoints = function (amount) {
        this._paramPoints = amount;
    };

    Game_Actor.prototype.addDistributedParam = function (paramId, value) {
        this._distributedParams[paramId] += value;
        this._distributedParams[paramId] = Math.min(
            this._distributedParams[paramId],
            maxParams[paramId]
        );
    };

    Game_Actor.prototype.paramNet = function (paramId) {
        const base = this.paramBase(paramId);
        const plus = Game_Battler.prototype.paramPlus.call(this, paramId);
        const distributed = this._distributedParams[paramId];
        return base + plus + distributed;
    };

    const _Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
    Game_Actor.prototype.paramPlus = function (paramId) {
        let value = _Game_Actor_paramPlus.call(this, paramId);
        value += this._distributedParams[paramId];
        return value;
    };

    const _Game_Actor_levelUp = Game_Actor.prototype.levelUp;
    Game_Actor.prototype.levelUp = function () {
        _Game_Actor_levelUp.call(this);
        this.gainParamPoints(gainPerLevel);
    };

    //--------------------------------------------------------------------------
    // Game_ParamDistributor

    function Game_ParamDistributor() {
        this.initialize(...arguments);
    }

    Game_ParamDistributor.prototype.initialize = function () {
        this._actor = null;
        this._undeterminedCost = 0;
        this._undeterminedParams = new Array(8).fill(0);
    };

    Game_ParamDistributor.prototype.actor = function () {
        return this._actor;
    };

    Game_ParamDistributor.prototype.setActor = function (actor) {
        if (this._actor !== actor) {
            this._actor = actor;
        }
    };

    Game_ParamDistributor.prototype.paramPoints = function () {
        return this.actor().paramPoints();
    };

    Game_ParamDistributor.prototype.undeterminedCost = function () {
        return this._undeterminedCost;
    };

    Game_ParamDistributor.prototype.addUndeterminedCost = function (value) {
        this._undeterminedCost += value;
    };

    Game_ParamDistributor.prototype.undeterminedParam = function (paramId) {
        return this._undeterminedParams[paramId];
    };

    Game_ParamDistributor.prototype.addUndeterminedParam = function (
        paramId,
        value
    ) {
        this._undeterminedParams[paramId] += value;
    };

    Game_ParamDistributor.prototype.resetUndetermined = function () {
        this._undeterminedCost = 0;
        this._undeterminedParams.fill(0);
    };

    Game_ParamDistributor.prototype.determineParams = function (actor) {
        const undeterminedParams = this._undeterminedParams;
        for (let paramId = 0; paramId < undeterminedParams.length; paramId++) {
            actor.addDistributedParam(paramId, undeterminedParams[paramId]);
        }
        actor.loseParamPoints(this._undeterminedCost);
        this._undeterminedCost = 0;
        this._undeterminedParams.fill(0);
    };

    //--------------------------------------------------------------------------
    // Window_MenuCommand

    Window_MenuCommand.prototype.addMainCommands = function () {
        const enabled = this.areMainCommandsEnabled();
        if (this.needsCommand('item')) {
            this.addCommand(TextManager.item, 'item', enabled);
        }
        if (this.needsCommand('skill')) {
            this.addCommand(TextManager.skill, 'skill', enabled);
        }
        if (this.needsCommand('equip')) {
            this.addCommand(TextManager.equip, 'equip', enabled);
        }
        if (this.needsCommand('status')) {
            this.addCommand(TextManager.status, 'status', enabled);
        }
        this.addCommand(textParamDistribution, 'paramDistribution', enabled);
    };

    //--------------------------------------------------------------------------
    // Window_ParamDistribution

    function Window_ParamDistribution() {
        this.initialize(...arguments);
    }

    Window_ParamDistribution.prototype = Object.create(
        Window_StatusBase.prototype
    );
    Window_ParamDistribution.prototype.constructor = Window_ParamDistribution;

    Window_ParamDistribution.prototype.initialize = function (
        rect,
        distributor
    ) {
        Window_StatusBase.prototype.initialize.call(this, rect);
        this._actor = null;
        this._distributor = distributor;
    };

    Window_ParamDistribution.prototype.setActor = function (actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_ParamDistribution.prototype.refresh = function () {
        Window_StatusBase.prototype.refresh.call(this);
        if (this._actor) {
            this.drawBlock1();
            this.drawBlock2();
        }
    };

    Window_ParamDistribution.prototype.drawBlock1 = function () {
        const lineHeight = this.lineHeight();
        const y = this.block1Y();
        this.drawActorFace(this._actor, 12, y);
        this.drawActorName(this._actor, 204, y, 168);
        this.drawActorClass(this._actor, 204, y + lineHeight, 168);
        this.drawActorLevel(this._actor, 204, y + lineHeight * 2);
        this.drawActorNickname(this._actor, 432, y, 270);
    };

    Window_ParamDistribution.prototype.block1Y = function () {
        return 0;
    };

    Window_ParamDistribution.prototype.drawBlock2 = function () {
        const y = this.block2Y();
        this.drawParamPolygon();
    };

    Window_ParamDistribution.prototype.block2Y = function () {
        return ImageManager.faceHeight;
    };

    Window_ParamDistribution.prototype.calcParamRatio = function (paramId) {
        const param = this._actor.paramNet(paramId);
        const undetermined = this._distributor.undeterminedParam(paramId);
        const ratio = (param + undetermined) / maxParams[paramId];
        return Math.log(5 * ratio + 1) / Math.log(6);
    };

    Window_ParamDistribution.prototype.drawParamPolygon = function () {
        const contents = this.contents;
        const sides = 8;
        const radius = this.innerWidth / 2 - 90 - 15; // Radius of the polygon
        const centerX = this.innerWidth / 2; // X position to draw the polygon
        const centerY =
            this.block2Y() + (this.innerHeight - this.block2Y()) / 2;
        const lineColor = 'rgb(165 165 255)';

        // Draw the background.
        for (let i = 0; i < 4; i++) {
            const lineWidth = i == 3 ? 3 : null;
            contents.strokePolygon(
                sides,
                centerX,
                centerY,
                (radius * (i + 1)) / 4,
                lineWidth,
                lineColor
            );
        }

        for (let i = 0; i < sides; i++) {
            const x =
                centerX +
                radius * Math.cos((2 * Math.PI * i) / sides - Math.PI / 2);
            const y =
                centerY +
                radius * Math.sin((2 * Math.PI * i) / sides - Math.PI / 2);
            contents.drawLine([x, y], [centerX, centerY], null, lineColor);
        }

        // Draw texts.
        const textRadius = radius + 20; // Radius of the polygon
        for (let i = 0; i < sides; i++) {
            const text = TextManager.param(i);
            const textWidth = 105; // Radius of the polygon
            const x =
                centerX +
                textRadius * Math.cos((2 * Math.PI * i) / sides - Math.PI / 2);
            const y =
                centerY +
                textRadius * Math.sin((2 * Math.PI * i) / sides - Math.PI / 2);
            const relatedX = x - centerX;
            if (relatedX == 0) {
                this.drawText(
                    text,
                    x - textWidth / 2,
                    y - this.lineHeight() / 2,
                    textWidth,
                    'center'
                );
            } else if (relatedX > 0) {
                this.drawText(text, x, y - this.lineHeight() / 2, textWidth);
            } else {
                this.drawText(
                    text,
                    x - textWidth,
                    y - this.lineHeight() / 2,
                    textWidth,
                    'right'
                );
            }
        }

        // Draw params.
        const paramPoints = [];
        for (let index = 0; index < sides; index++) {
            const ratio = this.calcParamRatio(index);
            const paramRadius = ratio * (radius - 3);
            const x =
                centerX +
                paramRadius *
                    Math.cos((2 * Math.PI * index) / sides - Math.PI / 2);
            const y =
                centerY +
                paramRadius *
                    Math.sin((2 * Math.PI * index) / sides - Math.PI / 2);
            paramPoints.push([x, y]);
        }
        const paramStrokeColor = 'rgba(255, 165, 165, 1.0)';
        const paramFillColor = 'rgba(255, 165, 165, 0.3)';
        contents.fillPath(paramPoints, paramFillColor);
        contents.strokePath(paramPoints, null, paramStrokeColor);
    };

    //--------------------------------------------------------------------------
    // Window_ParamDistributionCommand

    function Window_ParamDistributionCommand() {
        this.initialize(...arguments);
    }

    Window_ParamDistributionCommand.prototype = Object.create(
        Window_Selectable.prototype
    );
    Window_ParamDistributionCommand.prototype.constructor =
        Window_ParamDistributionCommand;

    Window_ParamDistributionCommand.prototype.initialize = function (
        rect,
        distributor
    ) {
        Window_Selectable.prototype.initialize.call(this, rect);
        this._actor = null;
        this._distributor = distributor;
        this.select(0);
    };

    Window_ParamDistributionCommand.prototype.isOkTriggered = function () {
        if (this.index() < 8 && this.canAdd()) {
            return Input.isRepeated('ok');
        }
        return Input.isTriggered('ok');
    };

    Window_ParamDistributionCommand.prototype.hasPoints = function () {
        const paramPoints = this._distributor.paramPoints();
        const undeterminedCost = this._distributor.undeterminedCost();
        const cost = costPerStep[this.index()];
        return paramPoints - undeterminedCost >= cost;
    };

    Window_ParamDistributionCommand.prototype.canAdd = function () {
        const index = this.index();
        const paramNet = this._actor.paramNet(index);
        const undetermined = this._distributor.undeterminedParam(index);
        const isMax = paramNet + undetermined >= maxParams[index];

        const canCost = this._distributor.paramPoints() >= costPerStep[index];
        return this.hasPoints() && !isMax && canCost;
    };

    Window_ParamDistributionCommand.prototype.processOk = function () {
        if (this.isCurrentItemEnabled()) {
            if (this.index() < 8) {
                if (this.canAdd()) {
                    this.playOkSound();
                } else {
                    this.playBuzzerSound();
                }
            } else if (this.index() == 8) {
                this.playOkSound();
            } else if (this.index() == 9) {
                SoundManager.playCancel();
            }
            this.updateInputData();
            this.deactivate();
            this.callOkHandler();
        } else {
            this.playBuzzerSound();
        }
    };

    Window_ParamDistributionCommand.prototype.setActor = function (actor) {
        if (this._actor !== actor) {
            this._actor = actor;
            this.refresh();
        }
    };

    Window_ParamDistributionCommand.prototype.maxItems = function () {
        return 10;
    };

    Window_ParamDistributionCommand.prototype.itemHeight = function () {
        return this.lineHeight();
    };

    Window_ParamDistributionCommand.prototype.drawItem = function (index) {
        const rect = this.itemLineRect(index);
        if (index < 8) {
            const name = TextManager.param(index);
            const undetermined = this._distributor.undeterminedParam(index);
            const value = this._actor.paramNet(index) + undetermined;
            this.changeTextColor(ColorManager.systemColor());
            this.drawText(name, rect.x, rect.y, 140);
            this.resetTextColor();
            this.drawText(value, rect.x + 140, rect.y, 60, 'right');
            if (undetermined != 0) {
                const suffix = `(+${undetermined})`;
                this.changeTextColor(ColorManager.powerUpColor());
                this.drawText(suffix, rect.x + 210, rect.y, 60, 'right');
            }
        } else if (index == 8) {
            this.resetTextColor();
            this.drawText(textOk, rect.x, rect.y, rect.width, 'center');
        } else if (index == 9) {
            this.resetTextColor();
            this.drawText(textReset, rect.x, rect.y, rect.width, 'center');
        }
    };

    Window_ParamDistributionCommand.prototype.drawParamPoints = function (
        index
    ) {
        const rect = this.itemLineRect(12);
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(textParamPoints, rect.x, rect.y, 140);
        this.resetTextColor();
        const undeterminedCost = this._distributor.undeterminedCost();
        const points = this._distributor.paramPoints() - undeterminedCost;
        this.drawText(points, rect.x + 140, rect.y, 60, 'right');
        if (undeterminedCost != 0) {
            const suffix = `(${-undeterminedCost})`;
            this.changeTextColor(ColorManager.powerDownColor());
            this.drawText(suffix, rect.x + 210, rect.y, 60, 'right');
        }
    };

    Window_ParamDistributionCommand.prototype.drawAllItems = function () {
        Window_Selectable.prototype.drawAllItems.apply(this, arguments);
        this.drawParamPoints();
    };

    Window_ParamDistributionCommand.prototype.getHelpText = function () {
        if (this.index() < 8) {
            var text = textParamHelp.replace(
                '%cost',
                costPerStep[this.index()]
            );
            text = text.replace('%value', gainPerStep[this.index()]);
            text = text.replace('%param', TextManager.param(this.index()));
            return text;
        }
        return '';
    };

    Window_ParamDistributionCommand.prototype.updateHelp = function () {
        this.setHelpWindowText(this.getHelpText());
    };

    Window_ParamDistributionCommand.prototype.setHelpWindowText = function (
        text
    ) {
        if (this._helpWindow) {
            this._helpWindow.setText(text);
        }
    };

    //--------------------------------------------------------------------------
    // Scene_Menu

    Scene_Menu.prototype.createCommandWindow = function () {
        const rect = this.commandWindowRect();
        const commandWindow = new Window_MenuCommand(rect);
        commandWindow.setHandler('item', this.commandItem.bind(this));
        commandWindow.setHandler('skill', this.commandPersonal.bind(this));
        commandWindow.setHandler('equip', this.commandPersonal.bind(this));
        commandWindow.setHandler('status', this.commandPersonal.bind(this));
        commandWindow.setHandler(
            'paramDistribution',
            this.commandPersonal.bind(this)
        );
        commandWindow.setHandler('formation', this.commandFormation.bind(this));
        commandWindow.setHandler('options', this.commandOptions.bind(this));
        commandWindow.setHandler('save', this.commandSave.bind(this));
        commandWindow.setHandler('gameEnd', this.commandGameEnd.bind(this));
        commandWindow.setHandler('cancel', this.popScene.bind(this));
        this.addWindow(commandWindow);
        this._commandWindow = commandWindow;
    };

    Scene_Menu.prototype.onPersonalOk = function () {
        switch (this._commandWindow.currentSymbol()) {
            case 'skill':
                SceneManager.push(Scene_Skill);
                break;
            case 'equip':
                SceneManager.push(Scene_Equip);
                break;
            case 'status':
                SceneManager.push(Scene_Status);
                break;
            case 'paramDistribution':
                SceneManager.push(Scene_ParamDistribution);
                break;
        }
    };

    //--------------------------------------------------------------------------
    // Scene_ParamDistribution

    function Scene_ParamDistribution() {
        this.initialize(...arguments);
        this._isDetermined = true;
        this._distributor = new Game_ParamDistributor();
    }

    Scene_ParamDistribution.prototype = Object.create(Scene_MenuBase.prototype);
    Scene_ParamDistribution.prototype.constructor = Scene_ParamDistribution;

    Scene_ParamDistribution.prototype.create = function () {
        Scene_MenuBase.prototype.create.call(this);
        this.createHelpWindow();
        this.createStatusWindow();
        this.createItemWindow();
    };

    Scene_ParamDistribution.prototype.helpAreaHeight = function () {
        return 0;
    };

    Scene_ParamDistribution.prototype.createHelpWindow = function () {
        const rect = this.helpWindowRect();
        this._helpWindow = new Window_Help(rect);
        this.addWindow(this._helpWindow);
    };

    Scene_ParamDistribution.prototype.helpWindowRect = function () {
        const ww = Graphics.boxWidth;
        const wh = this.helpHeight();
        const wx = 0;
        const wy = this.mainAreaBottom() - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_ParamDistribution.prototype.createStatusWindow = function () {
        const rect = this.statusWindowRect();
        this._statusWindow = new Window_ParamDistribution(
            rect,
            this._distributor
        );
        this.addWindow(this._statusWindow);
    };

    Scene_ParamDistribution.prototype.statusWindowRect = function () {
        const wx = this.distributionWidth();
        const wy = this.mainAreaTop();
        const ww = Graphics.boxWidth - wx;
        const wh = this.helpWindowRect().y - wy;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_ParamDistribution.prototype.createItemWindow = function () {
        const rect = this.itemWindowRect();
        const itemWindow = new Window_ParamDistributionCommand(
            rect,
            this._distributor
        );
        itemWindow.setHelpWindow(this._helpWindow);
        itemWindow.setHandler('ok', this.onDistributionOk.bind(this));
        itemWindow.setHandler('cancel', this.onDistributionCancel.bind(this));
        itemWindow.setHandler('pagedown', this.tryNextActor.bind(this));
        itemWindow.setHandler('pageup', this.tryPreviousActor.bind(this));
        itemWindow.activate();
        this.addWindow(itemWindow);
        this._itemWindow = itemWindow;
    };

    Scene_ParamDistribution.prototype.itemWindowRect = function () {
        const ww = this.distributionWidth();
        const wh = this.distributionHeight();
        const wx = 0;
        const wy = this.mainAreaBottom() - this.helpHeight() - wh;
        return new Rectangle(wx, wy, ww, wh);
    };

    Scene_ParamDistribution.prototype.distributionWidth = function () {
        return 320;
    };

    Scene_ParamDistribution.prototype.distributionHeight = function () {
        return this.helpWindowRect().y - this.mainAreaTop();
    };

    Scene_ParamDistribution.prototype.helpHeight = function () {
        return this.calcWindowHeight(1, false);
    };

    Scene_ParamDistribution.prototype.start = function () {
        Scene_MenuBase.prototype.start.call(this);
        this.refreshActor();
    };

    Scene_ParamDistribution.prototype.needsPageButtons = function () {
        return true;
    };

    Scene_ParamDistribution.prototype.refreshActor = function () {
        const actor = this.actor();
        this._distributor.setActor(actor);
        this._itemWindow.setActor(actor);
        this._statusWindow.setActor(actor);
    };

    Scene_ParamDistribution.prototype.onActorChange = function () {
        Scene_MenuBase.prototype.onActorChange.call(this);
        this.refreshActor();
        this._statusWindow.activate();
    };

    Scene_ParamDistribution.prototype.canAdd = function () {
        return this._itemWindow.canAdd();
    };

    Scene_ParamDistribution.prototype.onDistributionOk = function () {
        const index = this._itemWindow.index();
        if (index < 8 && this.canAdd()) {
            this._isDetermined = false;
            const paramNet = this._actor.paramNet(index);
            const undetermined = this._distributor.undeterminedParam(index);
            const distanceToMax = maxParams[index] - (paramNet + undetermined);
            const gain = Math.min(gainPerStep[index], distanceToMax);
            this._distributor.addUndeterminedParam(index, gain);
            this._distributor.addUndeterminedCost(costPerStep[index]);
            this.refreshParams();
        } else if (index == 8) {
            this.determineParams();
        } else if (index == 9) {
            this.resetParams();
        }
        this._itemWindow.activate();
    };

    Scene_ParamDistribution.prototype.onDistributionCancel = function () {
        if (this._isDetermined) {
            this.popScene();
        } else {
            this.resetParams();
        }
    };

    Scene_ParamDistribution.prototype.resetParams = function () {
        console.log('Reset');
        this._distributor.resetUndetermined();
        this.refreshParams();
        this._itemWindow.activate();
        this._isDetermined = true;
    };

    Scene_ParamDistribution.prototype.determineParams = function () {
        console.log('Determine');
        this._distributor.determineParams(this._actor);
        this.refreshParams();
        this._itemWindow.activate();
        this._isDetermined = true;
    };

    Scene_ParamDistribution.prototype.tryNextActor = function () {
        if (this._isDetermined) {
            Scene_MenuBase.prototype.nextActor.call(this);
        }
        this._itemWindow.activate();
    };

    Scene_ParamDistribution.prototype.tryPreviousActor = function () {
        if (this._isDetermined) {
            Scene_MenuBase.prototype.previousActor.call(this);
        }
        this._itemWindow.activate();
    };

    Scene_ParamDistribution.prototype.onActorChange = function () {
        Scene_MenuBase.prototype.onActorChange.call(this);
        this.refreshActor();
        this._itemWindow.activate();
    };

    Scene_ParamDistribution.prototype.refreshParams = function () {
        this._itemWindow.refresh();
        this._statusWindow.refresh();
    };
})();
