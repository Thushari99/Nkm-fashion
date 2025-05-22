import React from 'react';
import { PieChart } from '@mui/x-charts';

const PieChartComponent = () => {
    const data = [
        { name: 'Group A', value: 400 },
        { name: 'Group B', value: 300 },
        { name: 'Group C', value: 300 },
        { name: 'Group D', value: 200 }
    ];

    return (
        <div>
            <PieChart
                series={[{
                    data: data.map(item => ({ argument: item.name, value: item.value })),
                    innerRadius: 30,
                    outerRadius: 100,
                    paddingAngle: 5,
                    cornerRadius: 5,
                    startAngle: -45,
                    endAngle: 225,
                    cx: 150,
                    cy: 150,
                }]}
            />
        </div>
    );
};

export default PieChartComponent;