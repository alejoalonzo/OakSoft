"use client";

export default function BasicChart({ symbol = "ETHUSDT" }) {
  // Create URL to TradingView iframe
  const chartUrl = `https://www.tradingview.com/embed-widget/advanced-chart/?locale=en#%7B%22symbol%22%3A%22${symbol}%22%2C%22interval%22%3A%22D%22%2C%22timezone%22%3A%22Etc%2FUTC%22%2C%22theme%22%3A%22dark%22%2C%22style%22%3A%221%22%2C%22withdateranges%22%3Atrue%2C%22allow_symbol_change%22%3Atrue%2C%22save_image%22%3Afalse%2C%22calendar%22%3Afalse%2C%22hide_legend%22%3Atrue%2C%22hide_side_toolbar%22%3Afalse%2C%22studies_overrides%22%3A%7B%7D%2C%22overrides%22%3A%7B%7D%2C%22enabled_features%22%3A%5B%5D%2C%22disabled_features%22%3A%5B%5D%2C%22utm_source%22%3A%22localhost%22%2C%22utm_medium%22%3A%22widget%22%2C%22utm_campaign%22%3A%22chart%22%2C%22utm_term%22%3A%22${symbol}%22%7D`;

  return (
    <div className="w-full h-[500px] bg-gray-800 rounded-lg overflow-hidden">
      <iframe
        src={chartUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allowTransparency="true"
        scrolling="no"
        allowFullScreen={true}
        className="rounded-lg"
        title={`${symbol} Trading Chart`}
      />
    </div>
  );
}
