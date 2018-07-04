<template>
  <div>
    <div class="chargeCont">
      <!-- 套餐充值 -->
      <div class="weile" v-for="item in menuRecharge">
        <div class="weileLeft">
          <a>{{item.name}}</a>
          <span><a class="platform-send">{{item.details}}</a></span>
        </div>
        <div @click="menuPay(item)" class="chargePrice">￥{{item.price}}.00</div>
      </div>

      <!-- 手动充值 -->
      <div class="inputjine" v-show="Object.keys(handRecharge).length > 0">
        <div class="inputjineLeft">
          <input id="handRechargeInput" type="number" v-model="money" placeholder="请输入充值金额(5元起充)"/>
        </div>
        <div @click="handPay" class="inputjineRight">
          <span class="equal-to-diamaond" v-if="money > 0 && money < 1000">({{money*10}}钻)</span>
          <span class="equal-to-diamaond" v-if="money > 1000">({{extractedDiamond}}钻)</span>
          结算
        </div>
      </div>

      <!-- 朋友代充（暂未开发） -->
      <div class="inputjine">
        <div class="inputjineLeft">
          <a class="friend-recharge-instead">请朋友代充</a>
        </div>
        <div class="inputjineRight">代充</div>
      </div>
    </div> <!-- end of chargeCont -->

    <!-- 核对信息与确认充值的小弹窗 -->
    <div class="alert-charge" v-show="charge">
      <transition name="modal">
        <div class="charge-mask">
          <div class="modal-header">
            <p><img @click="chargeDele" src="../assets/images/room/gc_16.png"/><a>确认订单</a></p>
          </div>
          <div class="modal-body">
            <div class="charge-t"><span>商&nbsp;品&nbsp;名：<a>{{menuRechargeItemName}}</a></span></div>
            <div class="charge-t"><span>钻石数量：<a>{{num}}</a></span></div>
            <div class="charge-t"><span>金&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;额：<a>{{money}}元</a></span></div>
            <!-- 根据条件显示赠送的商品类型 -->
            <div class="charge-t" v-if="sendType == 1">
              <span>赠送钻石：<a>{{integral}}</a></span>
            </div>
            <div class="charge-t" v-else-if="sendType == 2">
              <span>赠送积分：<a>{{integral}}</a></span>
            </div>
            <!-- 支付方式 -->
            <div class="charge-way">
              <ul>
                <li @click="weixin" v-show="weixinShow">
                  <p class="zhifubao-l"><img
                    src="../assets/images/room/bc_38.png"/><a>微信支付</a></p>
                  <p class="zhifubao-r" v-show="show"><img
                    src="../assets/images/room/bc_42.png"/></p>
                </li>
                <li @click="other"  v-show="!weixinShow">
                  <p class="zhifubao-l"><img
                    src="../assets/images/room/bc_40.png"/><a>其他支付</a></p>
                  <p class="zhifubao-r" v-show="otherShow"><img
                    src="../assets/images/room/bc_42.png"/></p>
                </li>
              </ul>
            </div>
          </div> <!-- end of modal-body -->
          <!--<div @click="paySure" class="modal-footer">-->
            <!--<a>确认支付</a>-->
          <!--</div>-->
        </div> <!-- end of charge-mask -->
      </transition> <!-- end of transition -->
    </div> <!-- end of alert-charge，小弹窗结束  -->
  </div>
</template>
<script>
// 专门到Cookie里拿东西，参数就是键名，返回对应的值，如wawajitoken、userId等
function getCookie(name) {
  var v = window.document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

//从cookie里取出的用户的id
var user_id = getCookie("userId");

var urlhost = process.env.API_AJAX;
export default {
  data() {
    // 本页面要用到的所有变量
    return {
      amount: 0, // 账户余额
      mobile: "", // 手机号
      open_id: "", // openid
      account: "", // 用户名
      charge: false, // 是否显示确认提示框
      show: false,
      otherShow: false,
      index: 0, // 支付方式，暂时只有微信，微信是0，所以后面会改成0
      weixinShow: true,
      discount: 1, // 折扣
      shoping: "",
      iframeShow: false,
      url: "",
      payType: "", // 支付类型，1套餐充值，2手工充值
      menuRechargeItemName: "", // 套餐充值的名称
      money: "", // 金额（元）
      extractedDiamond: "", // 截取之后的钻石，用于手工支付时显示金额对应的钻石 //数量，过大就会截取显示
      num: "", // 钻石数量
      rebateId: "", // 充值赠送类型的id主键，这个字段对前端毫无意义，纯粹是提交用户充值信息时后端需要这个id，我才建的它
      sendType: 0, // 充值赠送礼物的类型，1钻石，2积分
      integral: "", // 充值送的积分/钻石数量
      proportion: 0, // 充值送积分/钻石的计算比例，向上取整，例如比例是15//充1元，1X10X0.15≈2个积分/钻石
      menuRecharge: {}, // 用于遍历的套餐充值集合
      handRecharge: {} // 手动充值
    };
  },
  components: {},
  created: function() {
    var _this = this;

    /**
     * 向后端要到套餐和手冲的基本信息，如套餐名称、价格、赠送类型、送多少等等，
     * 这些数据将在主体面板中遍历显示出来。
     */
    $.ajax({
      type: "GET",
      // url: "http://weixin.fkzzz.cn/pannel/pay",  // !!!正式环境
      url: "http://back.fkzzz.cn/pannel/pay", //测试环境
      data$Type: "jsonp",
      data: {
        user_id: user_id
      },
      success: function(response) {
        var mess = JSON.parse(response);
        if (mess.status != 0) {
          _this.menuRecharge = mess.message.rebate; // 套餐
          _this.handRecharge = mess.message.rebateProportion; // 手工充值
        } else {
          return false;
        }
      }
    }); // end of ajax
  }, // end of created

  mounted: function() {
    var _this = this;
    // _this.iframeShow = false;
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == "micromessenger") {
      _this.weixinShow = true;
      _this.index = 0;
    } else {
      _this.weixinShow = false;
      _this.index = 1;
    }

    /**
     * 根据用户的id，向后端要该用户的四个基本信息：
     * 用户名、余额、手机、微信openId。
     */
    var token = getCookie("wawajitoken");
    if (token) {
      $.ajax({
        type: "GET",
        url: urlhost + "usercenter/getphonemiamond?user_id=" + user_id,
        data$Type: "jsonp",
        data: {},
        success: function(response) {
          var mess = JSON.parse(response);

          if (mess.status == 0) {
            return false;
          } else {
            var msg = mess.message;
            _this.amount = msg.diamond_handsel + msg.diamond_recharge;
            _this.mobile = msg.mobile;
            _this.account = msg.account;
            _this.open_id = msg.wechat_openid;
          }
        }
      }); // end of ajax
    }
  }, // end of mounted

 

  methods: {
    test: function() {
      if (true) {
        console.log();
      }
    },

    /**
     * @name 套餐充值
     * @augments item 从menuRecharge集合中遍历出的单个的套餐信息
     * @author 张成
     * @description 用户点击套餐充值时将触发本方法，作用为改变data里的若干属性，
     * 如激活弹窗，给套餐名称、价格赋值等等。
     */
    menuPay: function(item) {
      this.charge = true; // 显示确认支付的弹窗
      this.payType = 1; // 充值类型设为套餐充值
      this.menuRechargeItemName = item.name; // 套餐名称
      this.money = item.price; // 价格（元）
      this.num = item.num; // 钻石数量
      this.sendType = item.rebate_type; // 赠送类型（1钻石，2积分）
      this.integral = item.integral; // 赠送的数量
      this.rebateId = item.id; // 赠送类型的id主键
    },

    /**
       * @name 手工充值
       * @author 张成
       * @description 用户手工输入充值金额，点击“结算”按钮时将触发本方法，作用为改
       变data里的若干属性，
       * 如激活弹窗，给套餐名称、价格赋值等等。要特别注意的是本方法的“赠送（钻石或
       者积分）数量”的计算：
       * 赠送类型是动态的，钻石1，积分2，计算的比例也是动态的，并且计算结果向上取整
       。
       * @example 赠送比例proportion为15，赠送类型2为，用户充值1元，那么他将得到：
       * 1*10 = 10 个钻石
       * 10（钻石）* (15/100) ≈ 2 个积分（向上取整）
       */
    handPay: function() {
      if (this.money < 5) {
        this.$layer.msg("充值金额不能低于5元");
      } else if (this.money % 1 !== 0) {
        this.$layer.msg("充值金额只能为整数");
      } else {
        this.charge = true; // 显示确认支付的弹窗
        this.menuRechargeItemName = "手工充值"; // 套餐名称
        this.payType = 2; // 充值类型设为手充
        //this.money = money                  // 价格（元）
        this.num = this.money * 10; // 钻石数量
        this.sendType = this.handRecharge.rebate_type; // 赠送类型（1钻石，2积分）
        this.integral = Math.ceil(
          this.num * (this.handRecharge.proportion / 100)
        ); // 赠送的数量
        this.rebateId = this.handRecharge.id; // 赠送类型的id主键
      }
    },

    // 支付方式选择微信会触发这里，目前只有微信一种方式，所以可以忽略这一步
    weixin: function() {
      this.show = true;
      this.otherShow = false;
      this.index = 0;
    },
    other: function() {
      this.show = false;
      this.otherShow = true;
      this.index = 1;
    },
    chargeDele: function() {
      this.charge = false;
    },

    /**
     * @name 确认支付
     * @author 张成
     * @description 在弹窗里核对信息后，点击“确认支付”触发，根据支付
     * 方式跳转对应的支付页面。2018-5-10号新版微信支付时新增的数据是
     * rebate_id、rebate_type、integral。
     */
    paySure: function() {
      this.charge = false; // 弹窗隐藏

      // 先填充好后端需要的字段
      var type = this.payType; // 充值类型，1:是套餐数据提交  2:计算的充值提交
      var user_name = this.account; //用户名
      var user_phone = this.mobile; //用户手机号码
      var goods_name = this.menuRechargeItemName; // 商品名称
      var rebate_id = this.rebateId; // 商品id
      var rebate_type = this.sendType; // 返利的商品类别
      var integral = this.integral; // 充值送的商品数量
      var num = this.num; // 充值的实际数量
      var amount = this.money; // 实际金额
      var discount = 1 * amount; // 折回金额
      var wechat_openid = this.open_id; // 微信的支付openID
      var notify = "http://weixin.fkzzz.cn/wechatpay/notify"; // 微信的回调地址
      var index = this.index; // 支付方式，暂时只有微信0

      // 下面2个是给专门给支付宝设计的
      var ontify = "http://weixin.fkzzz.cn/admin/rebateex/pressorder"; // 支付宝的回调地址
      var nreturn = encodeURIComponent(
        "http://fkzzz.cn/#/usercenter/payresults"
      ); // 支付宝特有的指向地址

      // 发送支付请求
      switch (index) {
        // 微信宝支付
        case 0:
          window.location.href =
            "http://weixin.fkzzz.cn/wechatpay" +
            "?" +
            "user_id=" +
            user_id +
            "&" +
            "user_name=" +
            user_name +
            "&" +
            "user_phone=" +
            user_phone +
            "&" +
            "goods_name=" +
            goods_name +
            "&" +
            "num=" +
            num +
            "&" +
            "amount=" +
            amount +
            "&" +
            "discount=" +
            discount +
            "&" +
            "notify=" +
            notify +
            "&" +
            "type=" +
            type +
            "&" +
            "wechat_openid=" +
            wechat_openid +
            "&" +
            // + "wechat_openid=o6jSuw5JwPw9cdPA7rkeTQuLAmI0"+ "&" // 测试用的固定openid
            // 下面几个是新增的
            "rebate_id=" +
            rebate_id +
            "&" +
            "rebate_type=" +
            rebate_type +
            "&" +
            "integral=" +
            integral +
            "&" +
            "old=1";
          break;

        // 支付宝支付
        case 1:
          window.location.href =
            "http://weixin.fkzzz.cn/order/alipay" +
            "?" +
            "user_id=" +
            user_id +
            "&" +
            "user_name=" +
            user_name +
            "&" +
            "user_phone=" +
            user_phone +
            "&" +
            "goods_name=" +
            goods_name +
            "&" +
            "num=" +
            num +
            "&" +
            "amount=" +
            amount +
            "&" +
            "discount=" +
            discount +
            "&" +
            "ontify=" +
            ontify +
            "&" +
            "nreturn=" +
            nreturn +
            "&" +
            "type=" +
            type +
            "&" +
            "rebate_id=" +
            rebate_id +
            "&" +
            "rebate_type=" +
            rebate_type +
            "&" +
            "integral=" +
            integral;
          break;

        default:
          break;
      } // end of 支付switch
    } // end of paySure
  }, // end of method

  beforeUpdate: function() {
    // 截取字符串，当用户输入的金额超过1000时，按钮里的钻石的显示会影响布局，所以只
    // 保留两位数字加“...”，如输入123456元，则显示“12...钻”
    this.extractedDiamond =
      (this.money * 10).toString().substring(0, 2) + "...";
  }
}; // end of export default
</script>
<style lang="scss" scoped>
@function n($n) {
  @return $n / 64 + rem;
}
div {
  width: 100%;
  height: 100%;
  top: 0px;
  background: #fef102;
  .chargeCont {
    padding-top: n(45);
    width: 90%;
    margin-left: 5%;
    padding-bottom: n(100);
    .weile {
      width: 100%;
      height: n(80);
      background: #ffffff;
      -webkit-border-radius: 10px;
      -moz-border-radius: 10px;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
      .weileLeft {
        width: 70%;
        float: left;
        height: 100%;
        display: inline-flex;
        justify-content: space-around;
        align-items: center;
        background: #fff;
        a {
          font-weight: bold;
          font-size: n(28);
        }
        .platform-send {
          font-size: n(20);
        }
      }
      .chargePrice {
        width: 30%;
        float: left;
        height: 100%;
        background: #000;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-weight: bold;
      }
    }
    .inputjine {
      width: 100%;
      height: n(80);
      background: #fff;
      -webkit-border-radius: 10px;
      -moz-border-radius: 10px;
      border-radius: 10px;
      -webkit-border-radius: 10px;
      -moz-border-radius: 10px;
      margin-bottom: 10px;
      .inputjineLeft {
        width: 70%;
        float: left;
        height: 100%;
        display: inline-flex;
        justify-content: space-around;
        align-items: center;
        background: #fff;
        input {
          box-shadow: inset 0.5px 1px 5px #333333;
          border-bottom-left-radius: 10px;
          border-top-left-radius: 10px;
          text-indent: 1em;
          width: 100%;
          height: 100%;
          // color: #c9c9c9;
          font-size: n(24);
        }
        .friend-recharge-instead {
          font-weight: bold;
          font-size: n(28);
        }
      }
      .inputjineRight {
        width: 30%;
        float: left;
        height: 100%;
        background: #000000;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        color: #fff;
        font-weight: bold;
        border-top-right-radius: 10px;
        border-bottom-right-radius: 10px;
        .equal-to-diamaond {
          font-weight: normal;
          font-size: 10px;
        }
      }
    }
  }
  .alert-charge {
    position: fixed;
    z-index: 99;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: table;
    transition: opacity 0.3s ease;
  }

  .charge-mask {
    position: relative;
    width: 80%;
    height: n(767);
    background: #f4f4f4;
    margin-left: 10%;
    margin-top: 20%;
    -webkit-border-radius: 15px;
    -moz-border-radius: 15px;
    border-radius: 15px;
    overflow: hidden;
    .modal-header {
      width: 100%;
      height: n(70);
      background: #fff001;
      p {
        width: 100%;
        height: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        position: relative;
        img {
          position: absolute;
          left: 10px;
          width: n(50);
          height: n(50);
        }
        a {
          font-size: 14px;
        }
      }
    }
    .modal-body {
      width: 80%;
      margin-left: 10%;
      margin-top: n(40);
      background: #fff;
      .charge-t {
        display: inline-flex;
        align-items: center;
        margin-left: n(50);
        font-size: n(24);
        width: 80%;
        height: n(50);
        background: #fff;
        img {
          width: n(50);
          height: n(50);
        }
        span {
          margin-left: n(20);
          a {
            font-weight: bold;
          }
        }
      }
      .charge-confirm-title {
        display: inline-flex;
        align-items: center;
        margin-left: n(50);
        font-size: n(24);
        width: 100%;
        height: n(50);
        img {
          width: n(50);
          height: n(50);
        }
        span {
          margin-left: n(20);
          a {
            font-weight: bold;
          }
        }
      }
      .charge-m {
        width: 80%;
        margin-left: 10%;
        list-style-type: disc;
        li {
          margin-top: 10px;
          color: #007add;
          a {
            letter-spacing: 1px;
            span {
              color: #017ae2;
            }
          }
        }
      }
      .charge-way {
        margin-top: 20px;
        width: 80%;
        margin-left: 10%;
        background: #fff;
        ul {
          li {
            width: 100%;
            height: n(60);
            display: inline-flex;
            align-items: center;
            justify-content: space-between;
            .zhifubao-l {
              height: n(44);
              img {
                width: n(44);
                height: n(44);
              }
              a {
                margin-left: 5px;
              }
            }
            .zhifubao-r {
              height: n(44);
              img {
                width: n(27);
                height: n(21);
              }
            }
          }
        }
      }
    }
    .modal-footer {
      position: absolute;
      bottom: 0;
      width: 100%;
      height: n(80);
      background: #fff001;
      text-align: center;
      line-height: n(80);
      a {
        font-size: 14px;
      }
    }
  }
}
</style>
