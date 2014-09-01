# Node-RED Node hardware

Mcp3008 is 10bit adc converter with SPI interface. This node-red node allow to easily interface raspberry pi with mcp3008.

## Raspberry SPI interface

See http://elinux.org howto activate SPI on raspberry (with raspbian OS).
use MOSI MISO and SCLK gpio pins.
select CE0 or CE1 with the edit node to adress two mcp3008.

## Channels on mcp3008

Select eight single channel or four differential channel with the mcp3008 edit node.

## Intervall time (in ms)
input intervall time, so the node output the mcp3008 A/C all the intervall time.
Or just one time if intervall=0.

## Start and Stop

Just push msg = {payload : start | stop} to start | stop the flow.
