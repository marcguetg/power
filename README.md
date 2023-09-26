# PowerReader
This module is utelized to monitor the power consumption and production. Specifically it monitors the following:
- Produced power (ok)
- Grid Voltage (ok)
- Grid Frequency (ok)
- Consumed power
- Consumed power sub unit

The former three are measured by a Growatt PV inverter which communicats by RS-485 via a no-brand RS-485 board. The latter two are read by a light sensitive resister from a smart power meter.

# Data streams
Base64 encoding shifted by ' '. Each data entry starts with a minor letter (a-z), were letters starting from x are reserved for testing purpuses.

## Solar stream (12 bytes long with header "a")
| Name      | Bit | offset     | unit  | max       |
| --------- | --- | ---------- | ----- | --------- |
| Time      | 28  | 1690000000 | s     | 23.1.2032 |
| Power     | 15  | 0          | 100mW | 3.2 kW    |
| Frequency | 11  | 4000       | 10mHz | 60 Hz     |
| Voltage   | 12  | 1000       | 100mV | 500V      |

## Diagnostic message (8 bytes long with header "b")
| Name      | Bit | offset     | unit  | max       |
| --------- | --- | ---------- | ----- | --------- |
| Time      | 22  | 1690000000 | 64s   | 23.1.2032 |
| Free Buff | 5   | 0          |       |           |
| Uptime    | 15  | 0          | 10min | 228d      |

## Power stream (9 bytes long with header "c")
| Name      | Bit | offset     | unit  | max       |
| --------- | --- | ---------- | ----- | --------- |
| Time      | 28  | 1690000000 | s     | 23.1.2032 |
| Power     | 20  | 0          | 100mW | 104 kW    |


# Wiring
```
            Power Meter        Photon                  RS 485            Growatt
                              ╔═══════╗ Vcc          ╔══════════╗ Vcc
Vcc       ┌───────────────────║A0 Vin ║──┘      ┌────║ /RE  Vcc ║──┘     ╔══╗
│     5k  │  5k-500k (PM)     ║   A5  ║─────────┴────║ DE   B   ║────────║7 ║
├─────R───┴────R──── GND      ║   Tx  ║──────────────║ DI   A   ║────────║8 ║
│                             ║   Rx  ║──────────────║ R0   GND ║──┐     ╚══╝
│         ┌───────────────────║A1 GND ║──┐           ╚══════════╝ GND
│     5k  │  5k-500k (PM)     ╚═══════╝ GND
└─────R───┴────R──── GND
```
