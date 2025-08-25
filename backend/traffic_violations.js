const trafficViolations = [
  {
    sNo: 1,
    violationName: "Towing charges",
    section: "41(i) C.P. Act",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 600, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 2,
    violationName: "Allowing unauthorized person to drive",
    section: "S 180/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 3,
    violationName: "Auto Refusal",
    section: "S 178(III)/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 4,
    violationName: "Auto without meter",
    section: "S 179/177",
    penalties: { twoWheeler: 0, threeWheeler: 500, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 5,
    violationName: "Auto/Cab Extra Demand",
    section: "S 177(5)",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 6,
    violationName: "Bus Bay Parking",
    section: "S 122/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 7,
    violationName: "Bus stopping at middle of the road",
    section: "S 184",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 1000, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 8,
    violationName: "Carrying Goods dangerously",
    section: "S 190(2)/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 9,
    violationName: "Carrying Goods in Private Vehicles",
    section: "S",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 10,
    violationName: "Carrying passengers in HTV/LGV",
    section: "S 177(8)",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 11,
    violationName: "obstruction to pedestrian walkway",
    section: "S 122/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 12,
    violationName: "obstruction to free flow of traffic at free left",
    section: "190(2) of M.V.Act r/w Rule 3&8 of MVDR, 2017",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 13,
    violationName: "Causing of Noise Pollution using Beacon Light",
    section: "S 190(2)/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 14,
    violationName: "Cell Phone Driving",
    section: "S 184",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 2
  },
  {
    sNo: 15,
    violationName: "Dangerous Driving",
    section: "S 184",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 16,
    violationName: "Dazzling Light",
    section: "R 432/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 17,
    violationName: "Disobedience of orders",
    section: "S 179(1)",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 18,
    violationName: "Disobeying Traffic Signal/ No entry/No right/No U Turn",
    section: "S 177(11)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 19,
    violationName: "Driving during disqualification period 182 MV Act",
    section: "S 182(1)",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 20,
    violationName: "Driving vehicle in unsafe condition",
    section: "S 190(2)/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 21,
    violationName: "Drunken Driving",
    section: "S 185(a)",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 3
  },
  {
    sNo: 22,
    violationName: "Drunken Driving",
    section: "S 185(a)",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 4
  },
  {
    sNo: 23,
    violationName: "Drunken Driving",
    section: "S 185(a)",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 5
  },
  {
    sNo: 24,
    violationName: "Emitting sound pollution using SILENCER (First time 1000/- next time 2000/-)",
    section: "CMVR 120 r/w 190(2)",
    penalties: { 
      twoWheeler: 1000, 
      threeWheeler: 1000, 
      fourWheeler: 1000, 
      lorryDCM: 1000, 
      truckHMV: 1000 
    },
    penaltyPoints: 0
  },
  {
    sNo: 25,
    violationName: "Erased/Irregular Number Plate",
    section: "S 80(A) APMVR, 50, 51 CMVR r/w 177 MV Act",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 26,
    violationName: "Erratic Braking",
    section: "24 RRR/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 27,
    violationName: "Extra Passengers",
    section: "S 177(6)",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 28,
    violationName: "Extra Projection on back side",
    section: "S 184",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 29,
    violationName: "Extra Projection on either side",
    section: "S 184",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 30,
    violationName: "Extra Projection on top",
    section: "S 422/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 31,
    violationName: "Extra School Children",
    section: "R 32(III)/177",
    penalties: { twoWheeler: 0, threeWheeler: 200, fourWheeler: 200, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 32,
    violationName: "Failure to give right of way",
    section: "11RRR/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 33,
    violationName: "Fancy/Irregular Number Plate",
    section: "S 80(A) APMVR, 50, 51 CMVR r/w 177 MV Act",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 34,
    violationName: "Foot Board Offenders",
    section: "S 123/177",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 35,
    violationName: "Harassment/Misbehaviour by Auto/Taxi driver",
    section: "S 177(3)",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 36,
    violationName: "Heavy and Slow vehicles Driving on right lane",
    section: "u/s MVDR-2017 Regulation 4(5) and Sec 177A of MVAct",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 37,
    violationName: "High Beam Light",
    section: "106 CMVR/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 38,
    violationName: "Improper/Irregular Number Plate",
    section: "S 80(A) APMVR, 50, 51 CMVR r/w 177 MV Act",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 39,
    violationName: "Lane/line Crossing",
    section: "119/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 40,
    violationName: "Meter Violation",
    section: "TS MVR 371/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 41,
    violationName: "Minor driving the vehicle under the age of 18 years",
    section: "S 181 of M.V.Act",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 42,
    violationName: "Multi Toned Horn / Air Horn",
    section: "119(2)CMVR/177 MVA",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 43,
    violationName: "N/S Signal by the police",
    section: "S 132/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 44,
    violationName: "No Entry",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 45,
    violationName: "No Right/Left Turn/U Turn",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 46,
    violationName: "No Stopping OR Standing",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 47,
    violationName: "No entry for Bus",
    section: "S 119/177,184,179",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 1600, lorryDCM: 1600, truckHMV: 1600 },
    penaltyPoints: 0
  },
  {
    sNo: 48,
    violationName: "No entry for DCM",
    section: "S 119/177,179",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 600, lorryDCM: 600, truckHMV: 600 },
    penaltyPoints: 0
  },
  {
    sNo: 49,
    violationName: "No entry for Lorry/Tractor/Heavy Vehicle",
    section: "S 119/177,184,179",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 1600, lorryDCM: 1600, truckHMV: 1600 },
    penaltyPoints: 0
  },
  {
    sNo: 50,
    violationName: "No parking at Bars/Restaurants",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 51,
    violationName: "No parking at Commercial Centers",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 52,
    violationName: "No parking at function halls",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 53,
    violationName: "No parking in front of entry/exit gate",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 54,
    violationName: "Not Transfer of Ownership",
    section: "S 50",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 55,
    violationName: "Not tying the helmet properly/Not putting the strap",
    section: "S 129/177",
    penalties: { twoWheeler: 100, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 56,
    violationName: "Not wearing helmet by pillion rider",
    section: "S 129/177",
    penalties: { twoWheeler: 100, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 57,
    violationName: "Out Side/Other district vehicle",
    section: "S 179(1)",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 58,
    violationName: "Over Speed (4W and above, Speed 101 kmph and above)",
    section: "184,179 (1),183(1), 177 M.V.Act",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 2000, lorryDCM: 2000, truckHMV: 2000 },
    penaltyPoints: 0
  },
  {
    sNo: 59,
    violationName: "Over speed (4W and above, Speed 71-100 kmph)",
    section: "S 184/177, 183(1)",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 1400, lorryDCM: 1400, truckHMV: 1400 },
    penaltyPoints: 0
  },
  {
    sNo: 60,
    violationName: "Over speeding/ Dangerous Driving",
    section: "S 184/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },

  {
    sNo: 61,
    violationName: "Overloading in goods vehicles",
    section: "S 422/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 62,
    violationName: "Overtaking From Left",
    section: "CR 15(G)/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 63,
    violationName: "Parking on service roads",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 64,
    violationName: "Parking or Wait near Bus stop",
    section: "S 177/179(1)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 65,
    violationName: "Permitting Boarding",
    section: "S 123/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 66,
    violationName: "Piloting with Driver",
    section: "S 125/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 67,
    violationName: "Racing and Trail of speed",
    section: "S 189",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 68,
    violationName: "Refusal to Ply",
    section: "S 178",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 69,
    violationName: "Refusal to give information",
    section: "S 179(2)",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 70,
    violationName: "Restriction on plying of vehicles",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 71,
    violationName: "Roof Travelling",
    section: "R 36(VIII)/177",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 72,
    violationName: "Signal Jumping",
    section: "R 436/177, S 184",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 2
  },
  {
    sNo: 73,
    violationName: "Siren",
    section: "119(2)CMVR/190(2)MVA",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 74,
    violationName: "Stop Line Crossing",
    section: "S 119 R/w 177 of MVA, 1988",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 75,
    violationName: "Stopping on the carriage way",
    section: "S 122/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 0, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 76,
    violationName: "Sudden turns without indication",
    section: "S 184",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 0, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 77,
    violationName: "Tampered/Irregular Number Plate",
    section: "S 80(A) APMVR, 50, 51 CMVR r/w 177 MV Act",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 78,
    violationName: "Temporarily vehicle taken into safe custody",
    section: "S 207",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 79,
    violationName: "Tinted glass/Black Film",
    section: "MV Rule 100, S 177/179(1) MV Act",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 700, lorryDCM: 700, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 80,
    violationName: "Triple Riding",
    section: "S 128/177, 184",
    penalties: { twoWheeler: 1200, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 81,
    violationName: "Unauthorized parking by Sand/Brick/Metal Lorries",
    section: "S 122/177",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 82,
    violationName: "Unauthorized parking by School/College buses",
    section: "S 122/177",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 100, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 83,
    violationName: "Using loud speakers",
    section: "CR 119(II)/178",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 84,
    violationName: "Using prohibited routes",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 85,
    violationName: "Vehicle Check Report",
    section: "S 130/177",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 86,
    violationName: "Violation of LL conditions (LL holder not accompanied by a valid DL person)",
    section: "S 177(1)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 87,
    violationName: "Violation of LL conditions (LL holder not following traffic rules)",
    section: "S 177(1)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 88,
    violationName: "Violation of LL conditions (Without L board)",
    section: "S 177(1)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 89,
    violationName: "Violation of one way rule",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 90,
    violationName: "Violation of sign board",
    section: "S 119/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 91,
    violationName: "W/o Badge",
    section: "S 181",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 92,
    violationName: "W/o Documents",
    section: "S 130/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 93,
    violationName: "W/o Driving License",
    section: "S 181/177",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 94,
    violationName: "W/o Insurance",
    section: "S 196/177",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 95,
    violationName: "W/o Number Plate",
    section: "S 80(A)/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  },
  {
    sNo: 96,
    violationName: "W/o PUC/Smoke Pollution",
    section: "S 190(2)",
    penalties: { twoWheeler: 1000, threeWheeler: 1000, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 97,
    violationName: "W/o Police Registration (Auto)",
    section: "TS MVR 269/177, S 76 CP Act",
    penalties: { twoWheeler: 0, threeWheeler: 200, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 98,
    violationName: "W/o Police Registration (Cab)",
    section: "TS MVR 270/177, S 76 CP Act",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 200, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 99,
    violationName: "W/o Registration/Permit",
    section: "S 192 (1) /177",
    penalties: { twoWheeler: 2000, threeWheeler: 2000, fourWheeler: 2000, lorryDCM: 2000, truckHMV: 5000 },
    penaltyPoints: 0
  },
  {
    sNo: 100,
    violationName: "W/o Seat Belt",
    section: "S 138(III)/177",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 1
  },
  {
    sNo: 101,
    violationName: "W/o Uniform",
    section: "S 177(4)",
    penalties: { twoWheeler: 0, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 102,
    violationName: "W/o carrying Driving License",
    section: "S 130/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 103,
    violationName: "Wearing improper/Half/Non-standard helmet",
    section: "S 129/177",
    penalties: { twoWheeler: 100, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 1
  },
  {
    sNo: 104,
    violationName: "Wheel Clamp for wrong parking",
    section: "U/S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 105,
    violationName: "Wilfully withholds the vehicle information",
    section: "S 179(2)",
    penalties: { twoWheeler: 500, threeWheeler: 500, fourWheeler: 500, lorryDCM: 500, truckHMV: 500 },
    penaltyPoints: 0
  },
  {
    sNo: 106,
    violationName: "Without Helmet/Not wearing helmet by rider",
    section: "S 129/177",
    penalties: { twoWheeler: 100, threeWheeler: 0, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 1
  },
  {
    sNo: 107,
    violationName: "Without Mirror/Improper use of rear view mirrors",
    section: "S 177(14)",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 108,
    violationName: "Without head lights in night time",
    section: "CR 105/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 0, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 109,
    violationName: "Writings on the vehicle",
    section: "S 50 of the M.V. Rules /177, 179 MV Act",
    penalties: { twoWheeler: 700, threeWheeler: 700, fourWheeler: 700, lorryDCM: 700, truckHMV: 700 },
    penaltyPoints: 0
  },
  {
    sNo: 110,
    violationName: "Wrong Parking in the carriage way",
    section: "S 122/177",
    penalties: { twoWheeler: 100, threeWheeler: 100, fourWheeler: 100, lorryDCM: 100, truckHMV: 100 },
    penaltyPoints: 0
  },
  {
    sNo: 111,
    violationName: "Wrong Side Driving (2 and 3 Wheeler)",
    section: "S 119/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 2
  },
  {
    sNo: 112,
    violationName: "Wrong Side Driving (4 Wheeler and above)",
    section: "S 119/177,179",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 700, lorryDCM: 700, truckHMV: 700 },
    penaltyPoints: 2
  },
  {
    sNo: 113,
    violationName: "Wrong or Unauthorized Parking/Obstruction of carriageway",
    section: "S 190(2)",
    penalties: { twoWheeler: 0, threeWheeler: 0, fourWheeler: 1000, lorryDCM: 1000, truckHMV: 1000 },
    penaltyPoints: 0
  },
  {
    sNo: 114,
    violationName: "Wrong/Unauthorized Parking",
    section: "S 122/177",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 0, lorryDCM: 0, truckHMV: 0 },
    penaltyPoints: 0
  },
  {
    sNo: 115,
    violationName: "Zig-Zag and reckless driving",
    section: "S 184",
    penalties: { twoWheeler: 200, threeWheeler: 200, fourWheeler: 200, lorryDCM: 200, truckHMV: 200 },
    penaltyPoints: 0
  }
];

// Helper functions for working with violations data
const getViolationsByVehicleType = (vehicleType) => {
  const typeMap = {
    'Motorcycle': 'twoWheeler',
    'Car': 'fourWheeler',
    'Auto Rickshaw': 'threeWheeler',
    'Bus': 'fourWheeler',
    'Truck': 'truckHMV',
    'Lorry': 'lorryDCM'
  };
  
  const penaltyKey = typeMap[vehicleType] || 'fourWheeler';
  
  return trafficViolations
    .filter(violation => violation.penalties[penaltyKey] > 0)
    .map(violation => ({
      sNo: violation.sNo,
      violationName: violation.violationName,
      section: violation.section,
      fine: violation.penalties[penaltyKey],
      penaltyPoints: violation.penaltyPoints
    }));
};

const getViolationByName = (violationName) => {
  return trafficViolations.find(v => v.violationName === violationName);
};

const getAllViolationNames = () => {
  return trafficViolations.map(v => v.violationName);
};

const calculateTotalFine = (violationNames, vehicleType) => {
  const typeMap = {
    'Motorcycle': 'twoWheeler',
    'Car': 'fourWheeler',
    'Auto Rickshaw': 'threeWheeler',
    'Bus': 'fourWheeler',
    'Truck': 'truckHMV',
    'Lorry': 'lorryDCM'
  };
  
  const penaltyKey = typeMap[vehicleType] || 'fourWheeler';
  
  return violationNames.reduce((total, violationName) => {
    const violation = getViolationByName(violationName);
    return total + (violation ? violation.penalties[penaltyKey] : 0);
  }, 0);
};

module.exports = {
  trafficViolations,
  getViolationsByVehicleType,
  getViolationByName,
  getAllViolationNames,
  calculateTotalFine
};