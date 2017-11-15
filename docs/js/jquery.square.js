/**
 * jquery.square.js
 * Simple adjusting layout library for Square Grid Layout
 *
 * @version 0.2.0
 * @author SUSH <sush@sus-happy.net>
 * @license MIT
 */
(function ($) {
    var Square = /** @class */ (function () {
        /**
         * Constructor
         *
         * @param $target
         * @param opt
         */
        function Square($target, opt) {
            this.set = {
                target: "square",
                inner: ".inner",
                scaleSplit: "_",
                width: 150,
                height: 150,
                space: 10,
                speed: 700,
                duration: 500
            };
            this.disabled = false;
            this.parentObj = null;
            this.target = null;
            this.resizeInter = null;
            this.prevWidth = null;
            this.width = 0;
            this.height = 0;
            this.space = 0;
            this.isFloated = false;
            if (opt)
                $.extend(this.set, opt);
            this.parentObj = $target.css('position', 'relative');
            this.target =
                this.parentObj
                    .find('*[class^=' + this.set.target + ']')
                    .css('position', 'absolute');
            this.prevWidth = this.parentObj.outerWidth();
            // are width and space is floated?
            this.isFloated =
                (isNaN(this.set.width) && this.set.width.match(/\%$/)) ||
                    (isNaN(this.set.space) && this.set.space.match(/\%$/));
            this.setSize();
            this.setPosition(0);
            $(window).on('resize.square', function () {
                this.resizeStart();
            }.bind(this));
        }
        /**
         * Starting resize window
         *
         * @return void
         */
        Square.prototype.resizeStart = function () {
            $(window).off('resize.square');
            // If disabled, don't running
            if (this.disabled) {
                return;
            }
            this.resizeInter = setInterval(function () {
                this.resizeCheck();
            }.bind(this), this.set.duration);
        };
        /**
         * Checking resize window
         *
         * @return void
         */
        Square.prototype.resizeCheck = function () {
            // If disabled, don't running
            if (this.disabled) {
                return;
            }
            this.prevWidth = this.parentObj.outerWidth();
            // if same width with previous width
            if (this.prevWidth === this.parentObj.outerWidth()) {
                clearInterval(this.resizeInter);
                $(window).on('resize.square', function () {
                    this.resizeStart();
                }.bind(this));
                this.resizeEnd();
            }
        };
        /**
         * Ending resize window
         *
         * @return void
         */
        Square.prototype.resizeEnd = function () {
            // If disabled, don't dunning
            if (this.disabled) {
                return;
            }
            if (this.isFloated) {
                this.setSize();
            }
            this.setPosition(this.set.speed);
        };
        /**
         * Set each boxes size
         *
         * @return void
         */
        Square.prototype.setSize = function () {
            // Calc box and space size
            this.calcSize();
            var self = this;
            this.target.each(function (i) {
                var scale = self.getScale($(this).attr('class'));
                var xsize = self.width * scale.x + self.space * (scale.x - 1);
                var ysize = self.height * scale.y + self.space * (scale.y - 1);
                $(this).css({ width: xsize, height: ysize });
                var inner = $(this).find(self.set.inner);
                if (inner.length > 0) {
                    inner.height(ysize);
                    if (inner.outerHeight() > ysize) {
                        var height = inner.height() - (inner.outerHeight() - ysize);
                        inner.height(height);
                    }
                }
            });
        };
        /**
         * Set position each boxes
         *
         * @param sp
         * @return void
         */
        Square.prototype.setPosition = function (sp) {
            var matrix = [];
            var mpos = { x: 0, y: 0 };
            var tHeight = 0;
            var self = this;
            this.target.each(function (i) {
                mpos = self.blankMatrix(matrix);
                var scale = self.getScale($(this).attr('class'));
                var sizey = self.height * scale.y + self.space * (scale.y - 1);
                if (self.checkSize(mpos.x, scale)) {
                    mpos.x = 0;
                    mpos.y += 1;
                }
                while (self.matrixCheck(matrix, mpos.x, mpos.y, scale)) {
                    mpos.x += 1;
                    if (self.checkSize(mpos.x, scale)) {
                        mpos.x = 0;
                        mpos.y += 1;
                    }
                }
                for (var x = 0; x < scale.x; x += 1) {
                    for (var y = 0; y < scale.y; y += 1) {
                        if (!matrix[mpos.x + x]) {
                            matrix[mpos.x + x] = [];
                        }
                        matrix[mpos.x + x][mpos.y + y] = true;
                    }
                }
                var pos = {
                    x: self.space + self.width * mpos.x + self.space * mpos.x,
                    y: self.space + self.height * mpos.y + self.space * mpos.y
                };
                if (sp > 0) {
                    self.goTween($(this), { left: pos.x, top: pos.y }, sp);
                }
                else {
                    $(this).css({ left: pos.x, top: pos.y });
                }
                tHeight =
                    pos.y + sizey + self.space > tHeight
                        ? pos.y + sizey + self.space
                        : tHeight;
            });
            if (sp > 0) {
                self.goTween(self.parentObj, { height: tHeight }, sp);
            }
            else {
                self.parentObj.css({ height: tHeight });
            }
        };
        /**
         * Get box scale
         *
         * @param clsName
         * @return {x: number, y: number}
         */
        Square.prototype.getScale = function (clsName) {
            var tmp = clsName.split(" ");
            for (var i in tmp) {
                if (tmp[i].match(this.set.scaleSplit)) {
                    var xNum = +tmp[i].split(this.set.scaleSplit)[1];
                    var yNum = +tmp[i].split(this.set.scaleSplit)[2];
                    if (xNum) {
                        if (yNum)
                            return { x: xNum, y: yNum };
                        else
                            return { x: xNum, y: xNum };
                    }
                }
            }
            return { x: 1, y: 1 };
        };
        /**
         * Check avaivable matrix position
         *
         * @param matrix
         * @param x
         * @param y
         * @param scale
         * @return boolean
         */
        Square.prototype.matrixCheck = function (matrix, x, y, scale) {
            if (!matrix) {
                return false;
            }
            for (var i = 0; i < scale.x; i++) {
                for (var j = 0; j < scale.y; j++) {
                    if (!matrix[x + i]) {
                        continue;
                    }
                    else if (!matrix[x + i][y + j]) {
                        continue;
                    }
                    return matrix[x + i][y + j];
                }
            }
            return false;
        };
        /**
         * Search blank position of matrix
         *
         * @param matrix
         * @return {x: number, y:number}
         */
        Square.prototype.blankMatrix = function (matrix) {
            var pos = { x: 0, y: 0 };
            var scale = { x: 1, y: 1 };
            while (this.matrixCheck(matrix, pos.x, pos.y, scale)) {
                pos.x += 1;
                if (this.checkSize(pos.x, scale)) {
                    pos.x = 0;
                    pos.y += 1;
                }
            }
            return pos;
        };
        /**
         * Check size
         *
         * @param x
         * @param scale
         * @return boolean
         */
        Square.prototype.checkSize = function (x, scale) {
            var size = this.width * scale.x + this.space * (scale.x - 1);
            var tsize = this.width * x + this.space * (x + 2) + size;
            return tsize > this.parentObj.outerWidth();
        };
        /**
         * Running animation of target object
         *
         * @param jObj
         * @param prop
         * @param sp
         * @return void
         */
        Square.prototype.goTween = function (jObj, prop, sp) {
            jObj.stop(true, false).animate(prop, sp);
        };
        /**
         * Calculate size
         *
         * @return void
         */
        Square.prototype.calcSize = function () {
            // Calc Space
            if (!isNaN(this.set.space)) {
                this.space = this.set.space;
            }
            else if (this.set.space.match(/\%$/)) {
                var per = +this.set.space.replace('%', '');
                this.space = this.parentObj.width() * (per / 100);
            }
            // Calc Width
            if (!isNaN(this.set.width)) {
                this.width = this.set.width;
            }
            else if (this.set.width.match(/\%$/)) {
                var per = +this.set.width.replace('%', '');
                var spaces = Math.ceil(100 / per);
                this.width =
                    (this.parentObj.width() - this.space * (spaces + 1)) *
                        (per / 100);
            }
            // Calc Height
            this.height = this.set.height;
        };
        /**
         * Destroy
         *
         * @return void
         */
        Square.prototype.destroy = function () {
            this.disabled = true;
            if (this.resizeInter) {
                clearInterval(this.resizeInter);
            }
            $(window).off('.square');
            this.parentObj.attr('style', '');
            this.target.attr('style', '');
        };
        return Square;
    }());
    $.fn.extend({
        square: function (opt) {
            return new Square($(this), opt);
        }
    });
})(jQuery);
